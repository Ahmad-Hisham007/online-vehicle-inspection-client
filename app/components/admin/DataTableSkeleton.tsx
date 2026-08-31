import { cn } from "@/lib/utils";

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

export default function DataTableSkeleton({
  columns,
  rows = 8,
  className,
}: DataTableSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      <table className="w-full min-w-[700px] border-collapse text-left">
        <thead>
          <tr className="bg-primary text-primary-foreground text-[13px] font-semibold tracking-wide">
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={i}
                className="border-r border-primary/30 px-4 py-2.5 last:border-r-0"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-primary-foreground/20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border transition-colors last:border-b-0"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="px-8 py-3 align-middle text-[13px] text-slate-700"
                >
                  <div
                    className={cn(
                      "h-9 animate-pulse rounded bg-muted",
                      // Random width for realism
                      colIndex === 0 && "w-12",
                      colIndex === 1 && "w-32",
                      colIndex === 2 && "w-20",
                      colIndex === 3 && "w-28",
                      colIndex === 4 && "w-24",
                      colIndex === 5 && "w-16",
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
