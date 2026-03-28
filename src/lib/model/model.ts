/**
 * === VERCEL AI SDK ("ai" package) ===
 * The core AI library that powers this entire app.
 * - customProvider: Creates a unified provider that wraps multiple AI services (Google, Groq, OpenRouter)
 *   into a single interface, so the app can switch models seamlessly.
 * - extractReasoningMiddleware: Middleware that extracts chain-of-thought reasoning from models
 *   (like Qwen) that wrap their thinking in <think> tags. This enables the "Think Longer" feature.
 * - wrapLanguageModel: Wraps a language model with middleware (used here to add reasoning extraction
 *   to the Qwen model).
 * World use cases: Chatbots, AI assistants, content generators, AI-powered search engines.
 */
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

/**
 * === VERCEL AI GATEWAY ("@ai-sdk/gateway") ===
 * A unified proxy to route AI requests through Vercel's gateway service.
 * Provides centralized billing, rate limiting, and fallback routing across providers.
 * Currently commented out in this project but was planned for Claude, GPT-5, DeepSeek models.
 * World use cases: Enterprise apps managing multiple AI providers with centralized control.
 */
import { createGateway } from "@ai-sdk/gateway";

/**
 * === LOBEHUB ICONS ("@lobehub/icons") ===
 * AI/LLM brand icon library — provides official-looking logos for AI companies.
 * Used here to display the correct logo next to each model in the model selector dropdown.
 * World use cases: AI apps, dashboards, or marketplaces showing which AI model is in use.
 */
import { Google, Qwen, Moonshot, Meta, OpenAI } from "@lobehub/icons";

/**
 * === GOOGLE AI PROVIDER ("@ai-sdk/google") ===
 * Connects the Vercel AI SDK to Google's Gemini models.
 * Used here for: Gemini 2.5 Flash (main chat model), Gemini image generation,
 * and Google Search grounding in the market research tool.
 * World use cases: Any app wanting to use Google's Gemini AI models.
 */
import { google } from "@ai-sdk/google";

/**
 * === GROQ PROVIDER ("@ai-sdk/groq") ===
 * Connects to Groq's ultra-fast inference API (runs models on specialized LPU hardware).
 * Used here for: Llama 3.3 70b, Qwen 32b (with reasoning), and Kimi K2.
 * World use cases: Apps needing extremely fast LLM inference (Groq is one of the fastest).
 */
import { groq } from "@ai-sdk/groq";

/**
 * === OPENROUTER PROVIDER ("@openrouter/ai-sdk-provider") ===
 * OpenRouter is a unified API gateway that provides access to 100+ AI models
 * (GPT-4, Claude, Llama, etc.) through a single API key.
 * Used here for: GPT-4o Mini (chat) and title generation.
 * World use cases: Apps wanting access to many models without managing multiple API keys.
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

export const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_KEY ?? "",
});

const custom = customProvider({
  languageModels: {
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gpt-4o-mini": openrouter("gpt-4o-mini"),
    "llama-3.3-70b-versatile": groq("llama-3.3-70b-versatile"),
    "moonshotai/kimi-k2-instruct-0905": groq(
      "moonshotai/kimi-k2-instruct-0905"
    ),
    // "gemini-3.0-flash": google("gemini-3-flash-preview"),
    "qwen/qwen3-32b": wrapLanguageModel({
      model: groq("qwen/qwen3-32b"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    // "xai/grok-code-fast-1": gateway("xai/grok-code-fast-1"),
    // "anthropic/claude-sonnet-4.5": gateway("anthropic/claude-sonnet-4.5"),
    // "anthropic/claude-haiku-4.5": gateway("anthropic/claude-haiku-4.5"),
    // "openai/gpt-5-codex": gateway("openai/gpt-5-codex"),
    // "deepseek/deepseek-v3.2": gateway("deepseek/deepseek-v3.2"),
    // "openai/gpt-5-mini": gateway("openai/gpt-5-mini"),
  },
});

export const MODEL_REGISTRY = {
  "qwen/qwen3-32b": {
    provider: custom,
    id: "qwen/qwen3-32b",
    name: "Qwen 32b",
    logo: Qwen,
  },
  // "gemini-3.0-flash": {
  //   provider: custom,
  //   id: "gemini-3.0-flash",
  //   name: "Gemini 3.0 Flash",
  //   logo: Google,
  // },
  "llama-3.3-70b-versatile": {
    provider: custom,
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70b",
    logo: Meta,
  },
  "moonshotai/kimi-k2-instruct-0905": {
    provider: custom,
    id: "moonshotai/kimi-k2-instruct-0905",
    name: "Kimi K2",
    logo: Moonshot,
  },
  "gpt-4o-mini": {
    provider: custom,
    id: "gpt-4o-mini",
    name: "4o Mini",
    logo: OpenAI,
  },
  "gemini-2.5-flash": {
    provider: custom,
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    logo: Google,
  },
  // "xai/grok-code-fast-1": {
  //   provider: custom,
  //   id: "xai/grok-code-fast-1",
  //   name: "Grok Code Fast",
  //   logo: XAI,
  // },
  // "anthropic/claude-sonnet-4.5": {
  //   provider: custom,
  //   id: "anthropic/claude-sonnet-4.5",
  //   name: "Claude Sonnet 4.5",
  //   logo: Anthropic,
  // },
  // "anthropic/claude-haiku-4.5": {
  //   provider: custom,
  //   id: "anthropic/claude-haiku-4.5",
  //   name: "Claude Haiku 4.5",
  //   logo: Anthropic,
  // },
  // "openai/gpt-5-codex": {
  //   provider: custom,
  //   id: "openai/gpt-5-codex",
  //   name: "GPT-5 Codex",
  //   logo: OpenAI,
  // },
  // "deepseek/deepseek-v3.2": {
  //   provider: custom,
  //   id: "deepseek/deepseek-v3.2",
  //   name: "DeepSeek V3.2",
  //   logo: DeepSeek,
  // },
  // "openai/gpt-5-mini": {
  //   provider: custom,
  //   id: "openai/gpt-5-mini",
  //   name: "GPT-5 Mini",
  //   logo: OpenAI,
  // },
} as const;

export type ModelId = keyof typeof MODEL_REGISTRY;

export const DEFAULT_MODEL_ID: ModelId = "gemini-2.5-flash";

export function getModelConfig(modelId: ModelId) {
  const config = MODEL_REGISTRY[modelId];
  if (!config) {
    console.warn(`Model ${modelId} not found, falling back to default`);
    return MODEL_REGISTRY[DEFAULT_MODEL_ID];
  }
  return config;
}

export function createModelInstance(modelId: ModelId) {
  const config = getModelConfig(modelId);
  return config.provider.languageModel(config.id);
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return modelId in MODEL_REGISTRY;
}
