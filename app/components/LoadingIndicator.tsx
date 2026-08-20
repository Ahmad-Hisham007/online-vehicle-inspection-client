"use client";

import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  variant?: "spinner" | "dots" | "pulse";
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

const RING_SIZES: Record<NonNullable<LoadingIndicatorProps["size"]>, string> = {
  sm: "size-5",
  md: "size-9",
  lg: "size-14",
  xl: "size-14 sm:size-20",
};

const DOT_SIZES: Record<NonNullable<LoadingIndicatorProps["size"]>, string> = {
  sm: "size-1.5",
  md: "size-2.5",
  lg: "size-3.5",
  xl: "size-3.5 sm:size-4.5",
};

export function LoadingIndicator({
  variant = "spinner",
  size = "md",
  label,
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      {variant === "spinner" && (
        <div
          className={cn(
            RING_SIZES[size],
            "rounded-full border-2 border-primary/25 border-t-primary animate-spin",
          )}
        />
      )}

      {variant === "dots" && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                DOT_SIZES[size],
                "rounded-full bg-primary animate-bounce",
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}

      {variant === "pulse" && (
        <div className={cn("relative", RING_SIZES[size])}>
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      )}

      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}