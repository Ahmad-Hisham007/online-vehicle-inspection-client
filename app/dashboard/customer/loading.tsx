import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import InspectionListSkeleton from "./_components/InspectionListSkeleton";

export default function CustomerDashboardLoading() {
  return (
    <CustomerPageShell>
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </div>
        </div>

        <InspectionListSkeleton />
      </div>
    </CustomerPageShell>
  );
}