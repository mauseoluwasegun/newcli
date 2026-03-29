

/**
 * === CONVEX SERVER UTILITIES ("convex/server") ===
 * - paginationOptsValidator: Validates pagination arguments (cursor, numItems)
 *   for paginated queries — enables infinite scrolling in the chat list.
 */
import { paginationOptsValidator } from "convex/server";

/**
 * === UUID ("uuid") ===
 * - validate: Checks if a string is a valid UUID format.
 *   Used here to validate chatId parameters before querying the database.
 * World use cases: Input validation, database ID verification.
 */
import { validate as uuidValidate } from "uuid";

/**
 * === CONVEX VALUES ("convex/values") ===
 * - ConvexError: Custom error class for Convex — thrown on auth failures, not-found, etc.
 *   These errors are sent back to the client with proper error messages.
 * - v: Runtime type validators for mutation/query arguments (v.string(), v.number(), etc.).
 */
import { ConvexError } from "convex/values";
import { v } from "convex/values";

/**
 * === CONVEX AUTO-GENERATED SERVER FUNCTIONS ===
 * - mutation: Defines a write operation (insert, update, delete) on the database.
 * - query: Defines a read operation. Queries are reactive — the frontend auto-updates
 *   when the underlying data changes (real-time subscriptions).
 */
import { mutation, query } from "./_generated/server";

/** === Auto-generated TypeScript types for document IDs === */
import type { Id } from "./_generated/dataModel";

/** === Better-auth Convex component — used to check authentication in every function === */
import { betterAuthComponent } from "./auth";

/** === Internal API — references to server-side only functions (like uploadthing cleanup) === */
import { internal } from "./_generated/api";

export const getChatByUUID = query({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    try {
      const chat = await ctx.db
        .query("chats")
        .withIndex("by_uuid", (q) => q.eq("id", chatId))
        .first();
      return chat || null;
    } catch (error) {
      console.error("Error fetching chat by UUID:", chatId, error);
      return null;
    }
  },
});

export const getMessagesByUUID = query({
  args: { messageId: v.string() }, //uuid
  handler: async (ctx, { messageId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_uuid", (q) => q.eq("id", messageId))
      .first();

    return messages;
  },
});

export const getMessagesByChatId = query({
  args: { chatId: v.string() }, //uuid
  handler: async (ctx, { chatId }) => {
    if (!chatId || !uuidValidate(chatId)) {
      return [];
    }

    try {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
        .collect();

      return messages;
    } catch (error) {
      console.error("Error fetching messages for chat:", chatId, error);
      // Return empty array on error to prevent client crash
      return [];
    }
  },
});

export const getMessagesWithImages = query({
  handler: async (ctx) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) {
      // Return empty array for unauthenticated users
      return [];
    }

    const messagesWithImages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", authUser.userId!))
      .filter((q) => q.or(q.neq(q.field("imageKey"), undefined)))
      .collect();

    return messagesWithImages || [];
  },
});

export const createMessage = mutation({
  args: {
    id: v.string(), // uuid
    role: v.string(),
    parts: v.any(),
    chatId: v.string(), // uuid
    imageKey: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    attachmentId: v.optional(v.string()),
    fileKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) throw new ConvexError("Unauthorized");

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      ...args,
      userId: authUser.userId!,
      createdAt: now,
      updatedAt: now,
    });
    return { convexId: messageId, uuid: args.id };
  },
});

export const updateMessage = mutation({
  args: {
    messageId: v.string(),
    attachmentId: v.optional(v.string()),
    parts: v.any(),
    fileKey: v.optional(v.string()),
  },
  handler: async (ctx, { messageId, parts, fileKey, attachmentId }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) throw new ConvexError("Unauthorized");

    const message = await ctx.db
      .query("messages")
      .withIndex("by_uuid", (q) => q.eq("id", messageId))
      .first();

    if (message) {
      await ctx.db.patch(message._id, {
        parts,
        role: "USER",
        userId: authUser.userId!,
        fileKey,
        attachmentId,
        imageKey: undefined,
        imageUrl: undefined,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteMessage = mutation({
  args: { id: v.string() }, //uuid
  handler: async (ctx, { id }) => {
    // delete attachments linked to this message
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_message", (q) => q.eq("messageId", id))
      .collect();

    // get messages with images if present
    const messagesWithImages = await ctx.db
      .query("messages")
      .withIndex("by_uuid", (q) => q.eq("id", id))
      .filter((q) => q.or(q.neq(q.field("imageKey"), undefined)))
      .collect();

    // uploadthing cleanup
    const imageKeys = messagesWithImages
      .map((m) => m.imageKey)
      .filter((k): k is string => !!k);

    const attachmentKeys = attachments
      .map((a) => a.key)
      .filter((k): k is string => !!k);

    const allKeys = [...imageKeys, ...attachmentKeys];

    if (allKeys.length > 0) {
      await ctx.scheduler.runAfter(0, internal.uploadthing.deleteFiles, {
        keys: allKeys,
      });
    }

    for (const att of attachments) {
      await ctx.db.delete(att._id);
    }

    const msgToDelete = await ctx.db
      .query("messages")
      .withIndex("by_uuid", (q) => q.eq("id", id))
      .first();

    if (!msgToDelete) throw new ConvexError("Message to delete was not found");
    await ctx.db.delete(msgToDelete._id);
  },
});

export const getAttachmentById = query({
  args: { attachmentId: v.string() }, //uuid
  handler: async (ctx, { attachmentId }) => {
    const attachment = await ctx.db
      .query("attachments")
      .withIndex("by_uuid", (q) => q.eq("id", attachmentId))
      .first();

    return attachment;
  },
});

export const createAttachment = mutation({
  args: {
    id: v.string(), // uuid
    messageId: v.string(),
    chatId: v.string(),
    name: v.string(),
    type: v.string(),
    url: v.string(),
    key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) throw new ConvexError("Unauthorized");

    const now = Date.now();
    const convexId = await ctx.db.insert("attachments", {
      ...args,
      createdAt: now,
      updatedAt: now,
      userId: authUser.userId!,
    });
    return { convexId, uuid: args.id };
  },
});

export const createChat = mutation({
  args: {
    id: v.string(), // uuid
    title: v.string(),
  },
  handler: async (ctx, { id, title }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) throw new ConvexError("Unauthorized");

    const existing = await ctx.db
      .query("chats")
      .withIndex("by_uuid", (q) => q.eq("id", id))
      .first();

    if (existing) return { convexId: existing._id, uuid: existing.id };

    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      id, //uuid
      title,
      status: "ready",
      archived: false,
      userId: authUser.userId!,
      createdAt: now,
      updatedAt: now,
    });

    return { convexId: chatId, uuid: id };
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.string(), //uuid
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) throw new ConvexError("Unauthorized");

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_uuid", (q) => q.eq("id", chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, {
        title,
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateChatStatus = mutation({
  args: {
    chatId: v.string(), //uuid
    status: v.string(),
  },
  handler: async (ctx, { chatId, status }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) throw new ConvexError("Unauthorized");

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_uuid", (q) => q.eq("id", chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, {
        status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const restore = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }
    const userId = authUser.userId as Id<"users">;

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_uuid", (q) => q.eq("id", chatId))
      .first();

    if (!chat || chat.userId !== userId) {
      throw new ConvexError("Chat not found");
    }

    return await ctx.db.patch(chat._id, {
      archived: false,
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }
    const userId = authUser.userId as Id<"users">;

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError("Chat not found");
    }

    return await ctx.db.patch(chatId, {
      archived: true,
      updatedAt: Date.now(),
    });
  },
});

export const rename = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }

    const userId = authUser.userId as Id<"users">;

    if (!title || title.trim().length === 0) {
      throw new ConvexError("Title cannot be empty");
    }

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError("Chat not found");
    }

    return await ctx.db.patch(chatId, {
      title: title.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const deleteOne = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }

    const userId = authUser.userId as Id<"users">;

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_uuid", (q) => q.eq("id", chatId))
      .first();

    if (!chat || chat.userId !== userId) {
      throw new ConvexError("Chat not found");
    }

    //all the attachments in that chat
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    const messagesWithImages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .filter((q) => q.or(q.neq(q.field("imageKey"), undefined)))
      .collect();

    const imageKeys = messagesWithImages
      .map((m) => m.imageKey)
      .filter((k): k is string => !!k);

    const attachmentKeys = attachments
      .map((a) => a.key)
      .filter((k): k is string => !!k);

    //uploadthing cleanup action
    const allKeys = [...imageKeys, ...attachmentKeys];

    if (allKeys.length > 0) {
      await ctx.scheduler.runAfter(0, internal.uploadthing.deleteFiles, {
        keys: allKeys,
      });
    }

    for (const attachment of attachments) {
      console.log("Deleting attachments");
      await ctx.db.delete(attachment._id);
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const streams = await ctx.db
      .query("streams")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();

    for (const stream of streams) {
      await ctx.db.delete(stream._id);
    }

    await ctx.db.delete(chat._id);

    return { success: true, id: chat.id };
  },
});

export const search = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, query }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) {
      // Allow unauthenticated users to see empty results
      return {
        results: [],
        isLoaded: true,
        continuation: null,
      };
    }

    const userId = authUser.userId as Id<"users">;

    let chatsQuery = ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("archived"), false));

    if (query) {
      chatsQuery = chatsQuery.filter((q) =>
        q.or(
          q.eq(q.field("title"), undefined),
          q.neq(q.field("title"), undefined)
        )
      );
    }

    const result = await chatsQuery.order("desc").paginate(paginationOpts);

    return result;
  },
});

export const getOne = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }
    const userId = authUser.userId as Id<"users">;

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError("Chat not found");
    }

    return chat;
  },
});

export const getMany = query({
  args: {
    paginationOpts: paginationOptsValidator,
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, { paginationOpts, isArchived = false }) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);

    if (!authUser) {
      // Allow unauthenticated users to see empty results
      // (anonymous users will be signed in automatically on the client)
      return {
        results: [],
        isLoaded: true,
        continuation: null,
      };
    }
    const userId = authUser.userId as Id<"users">;

    return ctx.db
      .query("chats")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("archived"), isArchived))
      .order("desc")
      .paginate(paginationOpts);
  },
});
