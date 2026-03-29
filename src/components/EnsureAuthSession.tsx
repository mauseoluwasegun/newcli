"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

export function EnsureAuthSession() {
  const session = authClient.useSession();
  const hasAttemptedSignIn = useRef(false);

  useEffect(() => {
    if (!session?.data && !hasAttemptedSignIn.current) {
      hasAttemptedSignIn.current = true;
      authClient.signIn.anonymous().catch((error) => {
        console.error("Failed to sign in anonymously:", error);
      });
    }
  }, [session]);

  return null;
}
