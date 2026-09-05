import React, { Suspense } from "react";
import AdminPageShell from "./AdminPageShell";
import { InspectionStatus } from "@/app/lib/types";
import DataTableSkeleton from "./DataTableSkeleton";
import RequestsContent from "./RequestsContent";
import { listRequests } from "@/app/actions/requests";
import { auth } from "@/auth";
import { isAdministrator } from "@/app/lib/access";

interface RequestsProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export const RequestsListing = async ({ searchParams }: RequestsProps) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status as InspectionStatus | null | undefined;
  const search = sp.search?.trim() || "";
  const [session, data] = await Promise.all([
    auth(),
    listRequests({ page, perPage: 8, status, search }),
  ]);
  const canAssign = isAdministrator(session?.user?.role);
  const rows = data.items;
  return (
    <AdminPageShell title="Requests">
      <Suspense
        fallback={
          <>
            {/* Toolbar skeleton */}
            <div className="mb-4 flex w-full items-center justify-between gap-2">
              <div className="relative">
                <div className="h-8.5 w-56 animate-pulse rounded border border-border bg-muted" />
              </div>
              <div className="h-8.5 w-32 animate-pulse rounded border border-border bg-muted" />
            </div>
            {/* Table skeleton */}
            <DataTableSkeleton columns={7} rows={8} />
          </>
        }
      >
        <RequestsContent
          rows={rows}
          search={search}
          page={page}
          status={status}
          totalPages={data.totalPages}
          total={data.total}
          canAssign={canAssign}
        />
      </Suspense>
    </AdminPageShell>
  );
};
