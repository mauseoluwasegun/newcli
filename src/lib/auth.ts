/**
 * === CONVEX SERVER TYPES ===
 * Auto-generated types from Convex. GenericCtx is the context object
 * passed to every Convex function — gives access to the database, auth, etc.
 */
import type { GenericCtx } from "@convex/_generated/server";

/**
 * === CONVEX + BETTER-AUTH INTEGRATION ("@convex-dev/better-auth") ===
 * - convex plugin: Syncs better-auth sessions/users with the Convex database.
 * - convexAdapter: Database adapter that stores all auth data (users, sessions, accounts)
 *   directly in Convex tables instead of a separate database.
 * - betterAuthComponent: The Convex component that handles auth state on the server side.
 *   Used in every mutation/query to check `betterAuthComponent.getAuthUser(ctx)`.
 * World use cases: Any Convex project that wants authentication without a separate auth DB.
 */
import { convex } from "@convex-dev/better-auth/plugins";
import { convexAdapter } from "@convex-dev/better-auth";
import { betterAuthComponent } from "@convex/auth";

/**
 * === BETTER-AUTH ("better-auth") ===
 * A full authentication framework for TypeScript apps.
 * - betterAuth: The main function that creates the auth instance with all config.
 * - anonymous plugin: Allows users to use the app without signing up first.
 *   When they later sign in with Google, their anonymous account is linked.
 * World use cases: Any app needing auth — social login, email/password, magic links, anonymous.
 */
import { anonymous } from "better-auth/plugins";
import { betterAuth } from "better-auth";


const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const createOptions = (ctx: GenericCtx) => ({
  baseURL,
  database: convexAdapter(ctx, betterAuthComponent),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  trustedOrigins: [
    "https://incligene.vercel.app",
    "http://localhost:3000",
  ],
  plugins: [
    anonymous({
      onLinkAccount: async () => {
        console.log("Linking anonymous account to new user");
      },
    }),
  ],
});

export const createAuth = (ctx: GenericCtx) => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    plugins: [...options.plugins, convex({ options })],
  });
};
