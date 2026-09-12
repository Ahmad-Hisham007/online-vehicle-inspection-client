"use client";
import { SessionProvider } from "next-auth/react";
import SessionExpiryHandler from "./SessionExpiryHandler";

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <SessionExpiryHandler />
      {children}
    </SessionProvider>
  );
};

export default SessionWrapper;
