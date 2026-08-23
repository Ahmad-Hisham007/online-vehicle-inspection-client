import { Skeleton } from "@/components/ui/skeleton";

function InspectionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-2 divide-x divide-border p-4">
        <div className="space-y-2 pr-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2 pl-4 text-right">
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="ml-auto h-5 w-16" />
        </div>
      </div>
      <div className="border-b border-border" />
      <div className="flex items-center justify-between px-5 py-3.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function InspectionListSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <InspectionCardSkeleton key={i} />
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
