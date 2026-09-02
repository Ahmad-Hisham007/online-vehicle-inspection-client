"use client";

import { useMemo, useState } from "react";
import DataTable from "@/app/components/admin/DataTable";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import { Checkbox } from "@/components/ui/checkbox";
import { formatInspectionDate } from "@/app/lib/format";
import type { DataTableColumn } from "@/app/components/admin/DataTable";

interface ProposalRow {
  id: number;
  fullName: string;
  email: string;
  dateCreated: string;
  resolved: boolean;
}

const SAMPLE_PROPOSALS: ProposalRow[] = [
  { id: 1714, fullName: "Bilson Mathew", email: "bilsonmathew@yahoo.com", dateCreated: "2026-08-20T02:53:00", resolved: true },
  { id: 1713, fullName: "Yazid Hussein", email: "nidalhussein2006@gmail.com", dateCreated: "2026-08-20T02:32:00", resolved: true },
  { id: 1712, fullName: "Miguel Pena", email: "miguelpena2024@gmail.com", dateCreated: "2026-08-19T22:45:00", resolved: false },
];

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export default function ProposalsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(SAMPLE_PROPOSALS);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter === "resolved" && !p.resolved) return false;
      if (filter === "unresolved" && p.resolved) return false;
      if (!q) return true;
      return (
        String(p.id).includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [search, filter, rows]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const toggleResolved = (id: number) => {
    setRows((prev) =>
      prev.map((p) => (p.id === id ? { ...p, resolved: !p.resolved } : p)),
    );
  };

  const columns: DataTableColumn<ProposalRow>[] = [
    {
      key: "resolved",
      header: "Resolved",
      cell: (p) => (
        <Checkbox
          checked={p.resolved}
          onCheckedChange={() => toggleResolved(p.id)}
          aria-label={`Resolve ${p.fullName}`}
        />
      ),
    },
    { key: "id", header: "ID", cell: (p) => <span className="font-medium">{p.id}</span> },
    { key: "fullName", header: "Full Name", cell: (p) => p.fullName },
    { key: "email", header: "E-mail", cell: (p) => p.email },
    { key: "dateCreated", header: "Date Created", cell: (p) => formatInspectionDate(p.dateCreated) },
    {
      key: "actions",
      header: "Actions",
      cell: (p) => (
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={() => toggleResolved(p.id)}
        >
          Resolve
        </button>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <AdminPageShell title="Proposals">
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(p) => p.id}
        search={search}
        page={page}
        total={filtered.length}
        totalPages={totalPages}
        isLoading={false}
        startTransition={() => {}}
      />
    </AdminPageShell>
  );
}