"use client";

import { cn } from "@/lib/utils";

interface CustomerPageShellProps {
  children: React.ReactNode;
  /** Applied to the outer dark <section> backdrop. */
  className?: string;
  /** Applied to the white canvas card. */
  contentClassName?: string;
}

/**
 * Shared containerized canvas for every customer dashboard page.
 * Mirrors the add-new-inspection layout: dark backdrop + fixed-width
 * white card at max-w-3xl, responsive on mobile.
 */
export default function CustomerPageShell({
  children,
  className,
  contentClassName,
}: CustomerPageShellProps) {
  return (
    <section
      className={cn("flex min-h-screen flex-col bg-gray-900", className)}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-clip rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-sm",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
