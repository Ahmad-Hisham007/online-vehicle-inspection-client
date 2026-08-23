import { Suspense } from "react";
import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import InspectionToolbar from "@/app/dashboard/(site)/customer/_components/InspectionToolbar";
import CustomerInspectionList from "@/app/dashboard/(site)/customer/_components/CustomerInspectionList";
import InspectionListSkeleton from "@/app/dashboard/(site)/customer/_components/InspectionListSkeleton";
import { INSPECTION_STATUSES } from "@/app/lib/types";
import type { InspectionStatus, SortDir } from "@/app/lib/types";

interface InspectionListingProps {
  searchParams: Promise<{ page?: string; status?: string; sort?: string }>;
}

export default async function InspectionListing({
  searchParams,
}: InspectionListingProps) {
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page) || 1);
  const sortDir: SortDir = sp.sort === "oldest" ? "oldest" : "newest";
  const rawStatus = sp.status ?? "";
  const status: InspectionStatus | null = (
    INSPECTION_STATUSES as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as InspectionStatus)
    : null;

  const listKey = `${page}|${status ?? ""}|${sortDir}`;

  return (
    <CustomerPageShell>
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border p-4">
          <InspectionToolbar status={status} sortDir={sortDir} />
        </div>

        <Suspense key={listKey} fallback={<InspectionListSkeleton />}>
          <CustomerInspectionList
            page={page}
            status={status}
            sortDir={sortDir}
          />
        </Suspense>
      </div>
    </CustomerPageShell>
  );
}
