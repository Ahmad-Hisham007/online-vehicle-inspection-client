import React, { Suspense } from "react";
import AdminPageShell from "./AdminPageShell";
import DataTableSkeleton from "./DataTableSkeleton";
import ArchiveContent from "./ArchiveContent";
import { listArchivedInspections } from "@/app/actions/archive";
import { InspectionStatus } from "@/app/lib/types";

interface ArchiveProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export const ArchiveListing = async ({ searchParams }: ArchiveProps) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search?.trim() || "";
  const status = sp.status as InspectionStatus | null | undefined;
  const data = await listArchivedInspections({
    page,
    perPage: 8,
    status,
    search,
  });
  const rows = data.items;
  return (
    <AdminPageShell title="Archive">
      <Suspense
        fallback={
          <>
            <div className="mb-4 flex w-full items-center justify-between gap-2">
              <div className="relative">
                <div className="h-[34px] w-56 animate-pulse rounded border border-border bg-muted" />
              </div>
              <div className="h-[34px] w-32 animate-pulse rounded border border-border bg-muted" />
            </div>
            <DataTableSkeleton columns={7} rows={8} />
          </>
        }
      >
        <ArchiveContent
          rows={rows}
          search={search}
          page={page}
          status={status}
          totalPages={data.totalPages}
          total={data.total}
        />
      </Suspense>
    </AdminPageShell>
  );
};
