"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { isRefreshAccessTokenError } from "@/app/lib/session-error";

/**
 * Forces a sign-out exactly once when NextAuth reports that the WordPress
 * refresh token was rejected (`session.error`). No polling — it only reacts to
 * session updates already produced by useSession().
 */
const SessionExpiryHandler = () => {
  const { data: session } = useSession();
  const signingOut = useRef(false);

  useEffect(() => {
    if (isRefreshAccessTokenError(session?.error) && !signingOut.current) {
      signingOut.current = true;
      void signOut({ redirectTo: "/login?expired=1" });
    }
  }, [session?.error]);

  return null;
};

export default SessionExpiryHandler;
