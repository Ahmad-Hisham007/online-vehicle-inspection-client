import { cn } from "@/lib/utils";
import { getStatusPillStyle } from "@/app/lib/status";
import type { InspectionStatus } from "@/app/lib/types";

interface StatusPillProps {
  status: InspectionStatus;
  className?: string;
}

export default function StatusPill({ status, className }: StatusPillProps) {
  const { label, className: pillClassName } = getStatusPillStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        pillClassName,
        className,
      )}
    >
      {label}
    </span>
  );
}
