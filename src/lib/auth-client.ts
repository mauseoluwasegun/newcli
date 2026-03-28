/**
 * === CONVEX BETTER-AUTH CLIENT PLUGIN ===
 * Client-side plugin that syncs auth state between better-auth and Convex.
 * Automatically sets the Convex auth token when the user logs in/out.
 */
import { convexClient } from "@convex-dev/better-auth/client/plugins";

/**
 * === BETTER-AUTH CLIENT PLUGINS ===
 * - anonymousClient: Client-side support for anonymous authentication.
 *   Allows calling authClient.signIn.anonymous() to create a temporary account.
 * - createAuthClient: Creates the client-side auth instance with React hooks
 *   (useSession, signIn, signOut, etc.).
 * World use cases: Any React app using better-auth for authentication.
 */
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";


const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [convexClient(), anonymousClient()],
});
