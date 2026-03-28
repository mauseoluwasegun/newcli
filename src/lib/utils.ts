/**
 * === CONVEX DATA MODEL ===
 * Auto-generated TypeScript types from the Convex schema (convex/schema.ts).
 * Doc<"messages"> gives you the exact type shape of a messages table row.
 */
import { Doc } from "@convex/_generated/dataModel";

/**
 * === DATE-FNS-TZ ("date-fns-tz") ===
 * Timezone-aware date utilities built on top of date-fns.
 * - toZonedTime: Converts a UTC date to a specific timezone.
 * - format: Formats dates into human-readable strings with timezone support.
 * Used here to inject the user's local date/time into the AI system prompt
 * so the AI knows what time it is for the user.
 * World use cases: Scheduling apps, international platforms, event management.
 */
import { toZonedTime, format } from "date-fns-tz";

/**
 * === CLSX ("clsx") ===
 * A tiny utility for conditionally joining CSS class names together.
 * Example: clsx("btn", isActive && "btn-active") → "btn btn-active"
 * World use cases: Every React project that uses CSS classes conditionally.
 */
import { clsx, type ClassValue } from "clsx";

/**
 * === TAILWIND MERGE ("tailwind-merge") ===
 * Intelligently merges Tailwind CSS classes, resolving conflicts.
 * Example: twMerge("px-4 px-8") → "px-8" (removes the conflicting px-4).
 * Combined with clsx in the cn() utility function below — used in every component.
 * World use cases: Any Tailwind CSS project to avoid class conflicts.
 */
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function injectCurrentDate(
  prompt: string,
  timezone: string = "Asia/Kolkata"
) {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);

  const formatted = format(zoned, "EEEE, MMMM d, yyyy 'at' h:mm a zzz", {
    timeZone: timezone,
  });

  return prompt.replace("{{CURRENT_DATE}}", `${formatted} (${timezone})`);
}

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

// convert convex messages to ai sdk format
export function convertConvexMessagesToAISDK(messages: Doc<"messages">[]) {
  return messages.map((msg) => ({
    id: msg.id, //uuid
    role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
    parts: msg.parts,
  }));
}

export const getLimit = (isVerified = false) => {
  return isVerified ? 20 : 5;
};
