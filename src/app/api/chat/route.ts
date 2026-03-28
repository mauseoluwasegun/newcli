/**
 * === VERCEL AI SDK ("ai" package) — Core streaming & message utilities ===
 * - streamText: Streams AI model responses token-by-token to the client in real-time.
 * - createUIMessageStream: Creates a structured message stream with lifecycle hooks
 *   (onFinish to save to DB, onError to handle failures).
 * - JsonToSseTransformStream: Transforms JSON stream into Server-Sent Events format for HTTP.
 * - convertToModelMessages: Converts UI message format into the format AI models expect.
 * - stepCountIs: Limits multi-step tool calling to prevent infinite loops (max 5 steps here).
 * - UIMessage: TypeScript type for chat messages (id, role, parts).
 * - smoothStream: Smooths token delivery for a better typing animation UX
 *   (delays 0.5ms, chunks by word instead of character).
 * World use cases: Any AI chat application with streaming responses.
 */
import {
  streamText,
  createUIMessageStream,
  JsonToSseTransformStream,
  convertToModelMessages,
  stepCountIs,
  UIMessage,
  smoothStream,
} from "ai";

/**
 * === TOOL DEFINITIONS (local) ===
 * Custom AI tools defined in this project that the AI can call during a conversation:
 * - getWeatherTool: Fetches weather data from OpenWeatherMap API
 * - webSearchTool: Searches the web using Exa AI
 * - marketResearchTool: Performs market analysis with charts using Google Search + Gemini
 */
import {
  getModelForTool,
  getWeatherTool,
  isValidTool,
  Tool,
  webSearchTool,
  marketResearchTool,
} from "@/lib/tools/tool";

/**
 * === MODEL CONFIGURATION (local) ===
 * The model registry and factory functions defined in src/lib/model/model.ts.
 * - createModelInstance: Creates an AI model instance from a model ID.
 * - DEFAULT_MODEL_ID: Fallback model (Gemini 2.5 Flash).
 * - isValidModelId: Type guard to validate model selection from cookies.
 */
import {
  createModelInstance,
  DEFAULT_MODEL_ID,
  isValidModelId,
  ModelId,
} from "@/lib/model/model";

/**
 * === RESUMABLE STREAM ("resumable-stream") ===
 * Enables AI response streams that survive network disconnections.
 * If a user's connection drops mid-response, they can reconnect and resume
 * exactly where they left off (backed by Redis for state persistence).
 * World use cases: AI chat apps, live video/audio, any long-running stream.
 */
import {
  createResumableStreamContext,
  ResumableStreamContext,
} from "resumable-stream";

/** === LOCAL UTILITIES === */
import { convertConvexMessagesToAISDK, injectCurrentDate } from "@/lib/utils";

/** === CONSTANTS — System prompts and rate limits === */
import { LIMITS, REASONING_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/constants";

/**
 * === CONVEX BETTER-AUTH FOR NEXT.JS ===
 * getToken: Extracts the auth token from the request cookies/headers
 * to authenticate Convex API calls from Next.js API routes.
 */
import { getToken } from "@convex-dev/better-auth/nextjs";

/** === TITLE GENERATION — Uses AI to auto-generate chat titles === */
import { generateTitleFromUserMessage } from "@/lib/chat";

/**
 * === CONVEX NEXT.JS CLIENT ("convex/nextjs") ===
 * - fetchMutation: Calls Convex mutations (write operations) from Next.js server-side code.
 * - fetchQuery: Calls Convex queries (read operations) from Next.js server-side code.
 * Unlike the React hooks (useMutation/useQuery), these work in API routes & server components.
 */
import { fetchMutation, fetchQuery } from "convex/nextjs";

/** === LOCAL — Cookie-based model/tool selection === */
import { getChatModelFromCookies } from "@/lib/model";
import { getToolFromCookies } from "@/lib/tools";

/** === CONVEX AUTO-GENERATED API — Type-safe references to all Convex functions === */
import { api } from "@convex/_generated/api";

/** === LOCAL — Auth factory function === */
import { createAuth } from "@/lib/auth";

/**
 * === UUID ("uuid") ===
 * Generates universally unique identifiers (v4 = random-based).
 * Used here to create unique IDs for streams and messages.
 * World use cases: Database primary keys, session tokens, file naming.
 */
import { v4 as uuidv4 } from "uuid";

/**
 * === NEXT.JS SERVER UTILITIES ("next/server") ===
 * - after: Registers a callback that runs after the response is sent.
 *   Used here with resumable-stream's waitUntil to keep the stream alive
 *   even after the HTTP response starts.
 */
import { after } from "next/server";

// Increased timeout for long responses (300 seconds = 5 minutes)
export const maxDuration = 300;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext(): ResumableStreamContext | null {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({ waitUntil: after });
    } catch (error) {
      if ((error as Error).message.includes("REDIS_URL")) {
        console.log("Resumable streams are disabled due to missing REDIS_URL");
      } else {
        console.error(error);
      }
    }
  }
  return globalStreamContext;
}

export async function POST(req: Request) {
  const {
    message,
    id: chatId,
    timezone = "Asia/Kolkata",
    trigger,
  } = await req.json();

  // Early validation
  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  const streamId = uuidv4();

  // Parallelize independent operations
  const [token, selectedTool, selectedModel] = await Promise.all([
    getToken(createAuth),
    getToolFromCookies(),
    getChatModelFromCookies(),
  ]);

  if (!token) {
    return new Response("Unautorized", { status: 401 });
  }

  // Parallelize user and chat queries
  const [user, previousMessages, existingChat] = await Promise.all([
    fetchQuery(api.auth.getCurrentUser, {}, { token }),
    fetchQuery(api.chats.getMessagesByChatId, { chatId }),
    fetchQuery(api.chats.getChatByUUID, { chatId }, { token }),
  ]);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tier = user.emailVerified ? "verified" : "guest";
  const limit = LIMITS[tier];
  const currentCount = user.messageCount ?? 0;

  if (currentCount >= limit) {
    console.warn("Rate limit exceeded for user", user._id);
    return new Response("Too Many Requests", { status: 429 });
  }

  // Create chat if it doesn't exist (non-blocking)
  if (!existingChat) {
    void fetchMutation(
      api.chats.createChat,
      { id: chatId, title: "New Chat" },
      { token }
    );
  }

  // Prepare messages and start stream immediately
  const uiMessages = convertConvexMessagesToAISDK(previousMessages);

  // Generate title in background (non-blocking)
  if (
    existingChat?.title.trim() === "New Chat" &&
    previousMessages.length <= 2 &&
    trigger !== "regenerate-message"
  ) {
    const userPrompt = (message as UIMessage).parts.find(
      (part) => part.type === "text"
    )?.text;

    if (userPrompt) {
      // Don't await - run in background
      generateTitleFromUserMessage(userPrompt)
        .then((updatedTitle) => {
          return fetchMutation(
            api.chats.updateChatTitle,
            { chatId, title: updatedTitle.split(" ").slice(0, 4).join(" ") },
            { token }
          );
        })
        .catch((error) => {
          console.error("Failed to generate title:", error);
        });
    }
  }

  // Append stream ID (non-blocking)
  void fetchMutation(api.streams.appendStreamId, { chatId, streamId });

  let tool: Tool = "none";

  if (selectedTool && isValidTool(selectedTool)) {
    tool = selectedTool;
  }

  let model: ModelId = DEFAULT_MODEL_ID;
  if (selectedModel && isValidModelId(selectedModel)) {
    model = selectedModel;
  }

  const finalModel = getModelForTool(tool, model);
  const modelInstance = createModelInstance(finalModel);

  const finalSystemPrompt =
    tool === "reasoning"
      ? injectCurrentDate(REASONING_SYSTEM_PROMPT, timezone)
      : injectCurrentDate(SYSTEM_PROMPT, timezone);

  const stream = createUIMessageStream({
    execute: ({ writer: dataStream }) => {
      const result = streamText({
        model: modelInstance,
        system: finalSystemPrompt,
        messages: convertToModelMessages(uiMessages),
        tools: {
          getWeatherTool,
          webSearchTool,
          marketResearchTool,
        },
        toolChoice: "auto",
        stopWhen: stepCountIs(5),
        experimental_transform: smoothStream({
          delayInMs: 0.5,
          chunking: "word",
        }),
      });

      result.consumeStream();

      if (tool === "reasoning") {
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      } else {
        dataStream.merge(result.toUIMessageStream());
      }
    },
    onFinish: async ({ messages }) => {
      try {
        const assistantMessages = messages.filter(
          (message) => message.role === "assistant"
        );

        const lastAssistantMessage = assistantMessages.at(-1);

        if (!lastAssistantMessage) {
          console.warn("No assistant message found in response.");
          return;
        }

        const hasToolCalls =
          lastAssistantMessage.parts?.some((part) =>
            part.type.startsWith("tool-")
          ) || false;

        const cost = hasToolCalls ? 5 : 1;

        // Parallelize mutations for faster completion
        await Promise.all([
          fetchMutation(
            api.chats.updateChatStatus,
            { chatId, status: "ready" },
            { token }
          ),
          fetchMutation(
            api.chats.createMessage,
            {
              id: uuidv4(),
              role: "AI",
              chatId,
              parts: lastAssistantMessage.parts ?? [],
            },
            { token }
          ),
          fetchMutation(api.user.updateUser, { cost }, { token }),
        ]);
      } catch (error) {
        console.log("Failed to save response in DB", (error as Error).message);
      }
    },
    onError: (error) => {
      void fetchMutation(
        api.chats.updateChatStatus,
        { chatId, status: "ready" },
        { token }
      );
      console.error("Stream error details:", error);
      return "An error occurred during stream";
    },
  });

  const streamContext = getStreamContext();
  if (streamContext) {
    try {
      // Use createNewResumableStream for POST - creates a new stream that can be resumed by multiple clients
      const resumableStream = await streamContext.createNewResumableStream(
        streamId,
        () => stream.pipeThrough(new JsonToSseTransformStream())
      );
      return new Response(resumableStream);
    } catch (error) {
      console.error("Error creating resumable stream:", error);
      return new Response(stream);
    }
  } else {
    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  }
}
