import { nextJsHandler } from "@convex-dev/better-auth/nextjs";

// Debug: Log which URL we're using
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "https://modest-bison-757.eu-west-1.convex.cloud";
console.log("[Auth Route] Using Convex Site URL:", convexSiteUrl);

export const { GET, POST } = nextJsHandler({ convexSiteUrl });
