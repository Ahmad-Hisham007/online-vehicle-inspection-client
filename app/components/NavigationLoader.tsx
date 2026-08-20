"use client";

import { useUIStore } from "@/app/store/uiStore";
import { LoadingIndicator } from "./LoadingIndicator";

export default function NavigationLoader() {
  const navPending = useUIStore((s) => s.navPending);

  if (!navPending) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-full bg-background/90 px-4 py-2 shadow-lg ring-1 ring-border backdrop-blur-sm">
        <LoadingIndicator variant="dots" size="sm" />
        <span className="text-sm font-medium text-muted-foreground">
          Loading
        </span>
      </div>
    </div>
  );
}