/** === Global CSS — Tailwind base styles, custom CSS variables, animations === */
import "./globals.css";

/**
 * === CONVEX CLIENT PROVIDER (local) ===
 * Wraps the app with a Convex client so all components can use useMutation/useQuery.
 * Convex provides real-time database subscriptions — the UI auto-updates when data changes.
 */
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

/**
 * === CONVEX QUERY CACHE ("convex-helpers") ===
 * Adds query-level caching to Convex subscriptions.
 * Prevents redundant re-fetches and improves performance when multiple components
 * subscribe to the same query. A performance optimization layer.
 * World use cases: Any Convex app with multiple components reading the same data.
 */
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";

/**
 * === THEME PROVIDER (local wrapper for "next-themes") ===
 * next-themes provides dark/light/system theme management for Next.js.
 * Detects user's OS preference and persists theme choice in localStorage.
 * World use cases: Any website with a dark/light mode toggle.
 */
import { ThemeProvider } from "@/components/theme/ThemeProvider";

/**
 * === ANONYMOUS AUTH AUTO-SIGN-IN ===
 * Ensures users are automatically signed in as anonymous if they don't have a session.
 */
import { useEnsureAuthSession } from "@/hooks/use-auth-session";

function EnsureAuthSession() {
  useEnsureAuthSession();
  return null;
}

/**
 * === NEXT.JS GOOGLE FONTS ("next/font/google") ===
 * Self-hosts Google Fonts at build time for better performance (no external requests).
 * - Geist: Clean sans-serif font (used as the main body font).
 * - Geist_Mono: Monospace variant (used for code blocks and technical text).
 * World use cases: Any Next.js app wanting optimized, self-hosted Google Fonts.
 */
import { Geist, Geist_Mono } from "next/font/google";

/** === Next.js Metadata type for SEO (title, description, icons) === */
import type { Metadata } from "next";

/**
 * === SONNER ("sonner") ===
 * A beautiful, minimal toast notification system for React.
 * - Toaster: The provider component placed in the root layout.
 * - toast (imported elsewhere): Shows notifications — toast.success(), toast.error(), etc.
 * World use cases: Any app showing success/error/info notifications.
 */
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AI chat app built using Next.js, Convex and Vercel AI SDK.",
  keywords: [
    "ai",
    "ai sdk",
    "ai sdk chat app",
    "convex ai chat app",
    "ai chat app",
    "next.js",
    "convex",
    "vercel",
  ],
  icons: {
    icon: [
      {
        rel: "icon",
        url: "/favicon-dark.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "icon",
        url: "/favicon-light.ico",
        media: "(prefers-color-scheme: light)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${geistMono.variable} ${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster expand={false} duration={2000} />
            <EnsureAuthSession />
            <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
