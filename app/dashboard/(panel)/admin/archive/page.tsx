"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/admin/DataTable";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import StatusPill from "@/app/components/admin/StatusPill";
import { formatInspectionDate } from "@/app/lib/format";
import type { DataTableColumn } from "@/app/components/admin/DataTable";
import type { InspectionStatus } from "@/app/lib/types";

interface ArchiveRow {
  id: number;
  status: InspectionStatus;
  date: string;
  user: string;
  location: string;
  certificates: string[];
}

const SAMPLE_ARCHIVE: ArchiveRow[] = [
  {
    id: 16406,
    status: "approved",
    date: "2026-08-22T19:02:00",
    user: "Reggie Ramirez",
    location: "Michigan (USA)",
    certificates: ["Uber", "HopSkip"],
  },
  {
    id: 16405,
    status: "approved",
    date: "2026-08-22T11:02:00",
    user: "OceanView Rides",
    location: "Florida (USA)",
    certificates: ["Turo"],
  },
];

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Uber", value: "uber" },
  { label: "Lyft", value: "lyft" },
  { label: "Turo", value: "turo" },
];

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export default function ArchivePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SAMPLE_ARCHIVE.filter((a) => {
      if (filter !== "all" && !a.certificates.some((c) => c.toLowerCase() === filter)) return false;
      if (!q) return true;
      return (
        String(a.id).includes(q) ||
        a.user.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search, filter]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const columns: DataTableColumn<ArchiveRow>[] = [
    { key: "id", header: "ID", cell: (a) => <span className="font-medium">{a.id}</span> },
    { key: "status", header: "Status", cell: (a) => <StatusPill status={a.status} /> },
    { key: "date", header: "Date", cell: (a) => formatInspectionDate(a.date) },
    { key: "user", header: "User", cell: (a) => a.user },
    { key: "location", header: "Location", cell: (a) => a.location },
    {
      key: "certificates",
      header: "Certificates",
      cell: (a) => (
        <div className="flex flex-col gap-1">
          {a.certificates.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 text-[12px] text-slate-600">
              <span className="text-primary">✓</span> {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (a) => (
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={() => router.push(`/dashboard/admin/inspection/${a.id}`)}
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Archive">
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(a) => a.id}
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
