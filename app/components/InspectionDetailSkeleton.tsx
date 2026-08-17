import { Skeleton } from "@/components/ui/skeleton";

export default function InspectionDetailSkeleton() {
  return (
    <div>
      <div className="md:p-4 p-2">
        <h1 className="mb-4 text-center text-xl font-bold text-foreground">
          Car details
        </h1>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border md:p-4 p-2.5">
            <div className="flex h-auto w-full items-stretch overflow-x-auto rounded-xl bg-primary/10 p-1 md:grid md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 shrink-0 rounded-lg px-4" />
              ))}
            </div>
            <Skeleton className="mt-4 aspect-video w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 rounded-t-2xl border-t border-border bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-20 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}