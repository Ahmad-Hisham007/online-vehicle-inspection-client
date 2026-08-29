import React from "react";
import AdminPageShell from "./AdminPageShell";
import DataTable, { DataTableColumn } from "./DataTable";
import Link from "next/link";
import { AdminRequestSummary, InspectionStatus } from "@/app/lib/types";
import { listRequests } from "@/app/actions/requests";
import StatusPill from "./StatusPill";
import { formatInspectionDate } from "@/app/lib/format";
import DataToolbar from "./DataToolbar";

interface RequestsProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}
const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export const RequestsListing = async ({ searchParams }: RequestsProps) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status as InspectionStatus | null | undefined;
  const search = sp.search?.trim() || "";
  const data = await listRequests({ page, perPage: 10, status, search });
  console.log(data);
  const rows = data.items;
  const columns: DataTableColumn<AdminRequestSummary>[] = [
    {
      key: "id",
      header: "ID",
      cell: (r) => <span className="font-medium">{r.id}</span>,
    },
    {
      key: "title",
      header: "Title",
      cell: (r) => <h2 className="font-bold">{r.title}</h2>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusPill status={r.inspectionStatus} />,
    },
    {
      key: "date",
      header: "Date",
      cell: (r) => formatInspectionDate(r.dateCreated),
    },
    { key: "user", header: "User", cell: (r) => r.author },
    { key: "location", header: "Location", cell: (r) => r.location },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Link
          prefetch
          href={`/dashboard/admin/inspection/${r.id}`}
          className={ACTION_CLASS}
        >
          View Inspecion
        </Link>
      ),
    },
  ];
  return (
    <AdminPageShell title="Requests">
      <DataToolbar initialSearchValue={search} initialStatusFilter={status} />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        search={search}
        page={page}
        status={status}

        // ------------------------------------------
        // onSearchChange={(v) => {
        //   setSearch(v);
        //   setPage(1);
        // }}

        // filterValue={filter}
        // onFilterChange={(v) => {
        //   setFilter(v);
        //   setPage(1);
        // }}
        // page={page}
        // totalItems={filtered.length}
      />
    </AdminPageShell>
  );
};
