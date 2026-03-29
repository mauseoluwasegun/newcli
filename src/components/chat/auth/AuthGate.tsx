"use client";

/**
 * === AUTH CLIENT (local, wraps "better-auth/react") ===
 * The client-side auth instance — provides methods for:
 * - authClient.getSession(): Check if user is logged in.
 * - authClient.signIn.anonymous(): Create an anonymous session (try before signup).
 * - authClient.signIn.social(): Sign in with Google OAuth.
 * See src/lib/auth-client.ts for the full setup.
 */
import { authClient } from "@/lib/auth-client";

/** === React hooks === */
import { useEffect, useState } from "react";

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const session = authClient.useSession();

  useEffect(() => {
    // useSession() returns { data: undefined | null | Session, error: ... }
    // data is undefined while loading, then null (no session) or Session (has user)
    // We consider the session "determined" when data is no longer undefined
    if (session?.data !== undefined) {
      setReady(true);
    }
  }, [session]);

  if (!ready) {
    return (
      <div className="fixed inset-0 overflow-hidden flex items-center justify-center">
        Redirecting to chat
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
