"use client";

import { useMemo, useState } from "react";
import DataTable from "@/app/components/admin/DataTable";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import { Checkbox } from "@/components/ui/checkbox";
import type { DataTableColumn } from "@/app/components/admin/DataTable";

interface UserRow {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  active: boolean;
}

const SAMPLE_USERS: UserRow[] = [
  { id: 7, email: "bov8@icloud.com", phone: "+18088009292", firstName: "Vitalii", lastName: "Boridko", active: true },
  { id: 10, email: "pav.kut.13@gmail.com", phone: "+14708365835", firstName: "Pavel", lastName: "Kutsevalov", active: true },
  { id: 13, email: "admin@mail.com", phone: "+18889025932", firstName: "Test", lastName: "Test", active: true },
];

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Customer", value: "customer" },
  { label: "Admin", value: "admin" },
  { label: "Inspector", value: "inspector" },
];

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SAMPLE_USERS.filter((u) => {
      if (!q) return true;
      return (
        String(u.id).includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const columns: DataTableColumn<UserRow>[] = [
    { key: "id", header: "ID", cell: (u) => <span className="font-medium">{u.id}</span> },
    { key: "email", header: "Email", cell: (u) => u.email },
    { key: "phone", header: "Phone", cell: (u) => u.phone },
    { key: "firstName", header: "First Name", cell: (u) => u.firstName },
    { key: "lastName", header: "Last Name", cell: (u) => u.lastName },
    {
      key: "active",
      header: "Active",
      cell: (u) => <Checkbox checked={u.active} aria-label={`${u.email} active`} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: () => (
        <button type="button" className={ACTION_CLASS}>
          Edit
        </button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Users">
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(u) => u.id}
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
