import { cn } from "@/lib/utils";
import { getStatusStyle } from "@/app/lib/status";
import type { InspectionStatus } from "@/app/lib/types";

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: "sm" | "md";
  className?: string;
}

export default function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const { label, dot, text } = getStatusStyle(status);

  return (
    <span className={cn("inline-flex items-center gap-1.5", size === "sm" ? "text-xs" : "text-sm", text, className)}>
      <span className={cn("size-2.5 rounded-full", dot)} />
      {label}
    </span>
  );
}