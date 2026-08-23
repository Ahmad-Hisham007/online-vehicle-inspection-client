import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayInspectionLoading() {
  return (
    <CustomerPageShell>
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mx-auto h-6 w-44" />
        <div className="mt-6 rounded-2xl border border-border p-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-3 w-12" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="h-11 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </CustomerPageShell>
  );
}