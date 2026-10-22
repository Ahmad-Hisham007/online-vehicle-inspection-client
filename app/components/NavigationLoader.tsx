"use client";

import { useUIStore } from "@/app/store/uiStore";
import { LoadingIndicator } from "./LoadingIndicator";

export default function NavigationLoader() {
  const navPending = useUIStore((s) => s.navPending);

  if (!navPending) return null;

  return (
    <div
      aria-label="Loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-8 shadow-lg">
        <LoadingIndicator variant="dots" size="xl" />
        <p className="text-sm text-muted-foreground">Loading</p>
      </div>
    </div>
  );
}
