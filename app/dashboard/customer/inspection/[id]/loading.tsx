import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function InspectionDetailLoading() {
  return (
    <CustomerPageShell>
      <div className="p-4">
        <Skeleton className="mx-auto h-6 w-36" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>

      <div className="sticky bottom-0 rounded-t-2xl border-t border-border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </CustomerPageShell>
  );
}
