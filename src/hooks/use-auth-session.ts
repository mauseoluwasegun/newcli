"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "better-auth/react";
import { authClient } from "@/lib/auth-client";

export function useEnsureAuthSession() {
  const { data: session, isPending } = useAuth();
  const hasAttemptedSignIn = useRef(false);

  useEffect(() => {
    // Only attempt to sign in if:
    // 1. Auth state is not pending
    // 2. No session exists
    // 3. We haven't already tried signing in (avoid loops)
    if (!isPending && !session && !authClient.isPending && !hasAttemptedSignIn.current) {
      hasAttemptedSignIn.current = true;
      authClient.signIn.anonymous().catch((error) => {
        console.error("Failed to sign in anonymously:", error);
      });
    }
  }, [session, isPending]);
}
