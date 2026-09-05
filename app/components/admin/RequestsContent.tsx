"use client";
import { useMemo, useState, useEffect, useTransition } from "react";
import { AdminRequestSummary, InspectionStatus } from "@/app/lib/types";
import DataTable, { DataTableColumn } from "./DataTable";
import DataToolbar from "./DataToolbar";
import StatusPill from "./StatusPill";
import AssigneeSelect from "./AssigneeSelect";
import { formatInspectionDate } from "@/app/lib/format";
import Link from "next/link";
import { formatLocation } from "@/app/lib/formatLocation";
import { listInspectors, InspectorOption } from "@/app/actions/assignment";

interface RequestContentProps {
  rows: AdminRequestSummary[];
  search: string;
  page: number;
  status: InspectionStatus | null | undefined;
  totalPages: number;
  total: number;
  canAssign?: boolean;
}
const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export default function RequestsContent({
  rows,
  search,
  page,
  status,
  totalPages,
  total,
  canAssign = false,
}: RequestContentProps) {
  const [isPending, startTransition] = useTransition();
  const [inspectors, setInspectors] = useState<InspectorOption[]>([]);
  const [inspectorsLoading, setInspectorsLoading] = useState(canAssign);

  useEffect(() => {
    if (!canAssign) return;
    let active = true;
    listInspectors()
      .then((opts) => {
        if (active) setInspectors(opts);
      })
      .catch(() => {
        if (active) setInspectors([]);
      })
      .finally(() => {
        if (active) setInspectorsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canAssign]);

  const columns = useMemo<DataTableColumn<AdminRequestSummary>[]>(
    () => [
      {
        key: "id",
        header: "ID",
        cell: (r) => <span className="font-medium">{r.id}</span>,
      },
      {
        key: "title",
        header: "Title",
        className: "max-w-30",
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
      {
        key: "inspector",
        header: "Inspector",
        cell: (r) => (
          <AssigneeSelect
            inspectionId={r.id}
            current={r.assignedInspector ?? null}
            canAssign={canAssign}
            inspectors={inspectors}
            inspectorsLoading={inspectorsLoading}
          />
        ),
      },
      {
        key: "location",
        header: "Location",
        cell: (r) => formatLocation(r.country, r.location),
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
            View Inspecion
          </Link>
        ),
      },
    ],
    [canAssign, inspectors, inspectorsLoading],
  );

  return (
    <>
      <DataToolbar
        initialSearchValue={search}
        initialStatusFilter={status}
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
