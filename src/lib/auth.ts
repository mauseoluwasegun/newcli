/**
 * === CONVEX SERVER TYPES ===
 * createAuth is used in both queries and actions, so we accept a generic context type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCtx = any;

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


const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "https://newcli-theta.vercel.app";

const createOptions = (ctx: AnyCtx) => ({
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
    "https://newcli-theta.vercel.app",
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

export const createAuth = (ctx: GenericActionCtx<DataModel>) => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    plugins: [...options.plugins, convex({ options })],
  });
};

/**
 * Auth route handler for Next.js App Router.
 * Proxies auth requests to the Convex deployment where the actual auth logic runs.
 */
export const auth = {
  handler: async (request: Request): Promise<Response> => {
    const requestUrl = new URL(request.url);
    const convexSiteUrl =
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
      process.env.NEXT_PUBLIC_CONVEX_URL ??
      "https://modest-bison-757.eu-west-1.convex.cloud";
    if (!convexSiteUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is not set");
    }
    const nextUrl = `${convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`;
    const newRequest = new Request(nextUrl, request);
    newRequest.headers.set("accept-encoding", "application/json");
    return fetch(newRequest, { method: request.method, redirect: "manual" });
  },
};
