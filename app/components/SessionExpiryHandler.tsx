"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { shouldForceSignOut } from "@/app/lib/session-error";

/**
 * Forces a sign-out exactly once when NextAuth reports that the WordPress
 * refresh token was rejected (`session.error`). No polling — it only reacts to
 * session updates already produced by useSession(). Never fires on the login
 * page, otherwise sign-out and the login redirect ping-pong.
 */
const SessionExpiryHandler = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const signingOut = useRef(false);

  useEffect(() => {
    if (shouldForceSignOut(pathname, session?.error) && !signingOut.current) {
      signingOut.current = true;
      void signOut({ redirectTo: "/login?expired=1" });
    }
  }, [session?.error, pathname]);

  return null;
};

export default SessionExpiryHandler;
