"use client";
import { AdminArchiveRow, InspectionStatus } from "@/app/lib/types";
import DataTable, { DataTableColumn } from "./DataTable";
import DataToolbar from "./DataToolbar";
import StatusPill from "./StatusPill";
import { formatInspectionDate } from "@/app/lib/format";
import Link from "next/link";
import { useTransition } from "react";
import { formatLocation } from "@/app/lib/formatLocation";
import { COMPANY_LABELS } from "@/app/lib/companyLabels";

interface ArchiveContentProps {
  rows: AdminArchiveRow[];
  search: string;
  page: number;
  status: InspectionStatus | null | undefined;
  totalPages: number;
  total: number;
}

const ARCHIVE_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

const columns: DataTableColumn<AdminArchiveRow>[] = [
  {
    key: "id",
    header: "ID",
    cell: (r) => <span className="font-medium">{r.id}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusPill status={r.inspectionStatus} />,
  },
  {
    key: "title",
    header: "Title",
    className: "max-w-30",
    cell: (r) => <h2 className="font-bold">{r.title}</h2>,
  },
  {
    key: "date",
    header: "Date",
    cell: (r) => formatInspectionDate(r.dateCreated),
  },
  { key: "user", header: "User", cell: (r) => r.author },
  {
    key: "location",
    header: "Location",
    cell: (r) => formatLocation(r.country, r.location),
  },
  {
    key: "certificates",
    header: "Certificates",
    cell: (r) => (
      <div className="flex flex-col gap-1">
        {r.companies.length === 0 ? (
          <span className="text-[12px] text-muted-foreground">—</span>
        ) : (
          r.companies.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[12px] text-slate-600"
            >
              <span className="text-primary">✓</span> {COMPANY_LABELS[c] ?? c}
            </span>
          ))
        )}
      </div>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    className: "w-27 whitespace-nowrap",
    cell: (r) => (
      <Link
        prefetch
        href={`/dashboard/admin/inspection/${r.id}`}
        className={ACTION_CLASS}
      >
        Details
      </Link>
    ),
  },
];

export default function ArchiveContent({
  rows,
  search,
  page,
  status,
  totalPages,
  total,
}: ArchiveContentProps) {
  const [isPending, startTransition] = useTransition();
  return (
    <>
      <DataToolbar
        initialSearchValue={search}
        initialStatusFilter={status}
        filterOptions={ARCHIVE_FILTER_OPTIONS}
        startTransition={startTransition}
        isPending={isPending}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        search={search}
        page={page}
        status={status}
        totalPages={totalPages}
        total={total}
        isLoading={isPending}
        startTransition={startTransition}
      />
    </>
  );
}
