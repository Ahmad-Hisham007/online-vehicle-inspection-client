"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/admin/DataTable";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import StatusPill from "@/app/components/admin/StatusPill";
import { formatInspectionDate } from "@/app/lib/format";
import type { DataTableColumn } from "@/app/components/admin/DataTable";
import type { InspectionStatus } from "@/app/lib/types";

interface RequestRow {
  id: number;
  status: InspectionStatus;
  date: string;
  user: string;
  location: string;
}

const SAMPLE_REQUESTS: RequestRow[] = [
  { id: 16406, status: "pending", date: "2026-08-22T19:02:00", user: "Reggie Ramirez", location: "Michigan (USA)" },
  { id: 16405, status: "paid", date: "2026-08-22T11:02:00", user: "OceanView Rides", location: "Florida (USA)" },
  { id: 16404, status: "payment_failed", date: "2026-08-22T07:47:00", user: "Joshua Sanchez", location: "California (USA)" },
  { id: 16403, status: "in_progress", date: "2026-08-21T16:30:00", user: "Bilson Mathew", location: "Texas (USA)" },
  { id: 16402, status: "paid", date: "2026-08-21T10:15:00", user: "Yazid Hussein", location: "Ontario (CA)" },
];

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Payment failed", value: "payment_failed" },
];

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export default function RequestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SAMPLE_REQUESTS.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search, filter]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const columns: DataTableColumn<RequestRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-medium">{r.id}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    { key: "date", header: "Date", cell: (r) => formatInspectionDate(r.date) },
    { key: "user", header: "User", cell: (r) => r.user },
    { key: "location", header: "Location", cell: (r) => r.location },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={() => router.push(`/dashboard/admin/inspection/${r.id}`)}
        >
          View Inspection
        </button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Requests">
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r.id}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filterOptions={FILTER_OPTIONS}
        filterValue={filter}
        onFilterChange={(v) => {
          setFilter(v);
          setPage(1);
        }}
        page={page}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </AdminPageShell>
  );
}
