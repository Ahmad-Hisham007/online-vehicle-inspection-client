"use client";
import { AdminUserRow } from "@/app/lib/types";
import React, { useTransition } from "react";
import DataTable, { DataTableColumn } from "../DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import DataToolbar from "../DataToolbar";

interface AdminUsersContenrProps {
  rows: AdminUserRow[];
  search: string;
  page: number;
  totalPages: number;
  total: number;
}

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";
const columns: DataTableColumn<AdminUserRow>[] = [
  {
    key: "id",
    header: "ID",
    cell: (u) => <span className="font-medium">{u.id}</span>,
  },
  { key: "email", header: "Email", cell: (u) => u.email },
  { key: "phone", header: "Phone", cell: (u) => u.phone },
  { key: "firstName", header: "First Name", cell: (u) => u.firstName },
  { key: "lastName", header: "Last Name", cell: (u) => u.lastName },
  {
    key: "active",
    header: "Active",
    cell: (u) => <Checkbox checked={true} aria-label={`${u.email} active`} />,
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
const AdminUsersContent = ({
  rows,
  page,
  search,
  total,
  totalPages,
}: AdminUsersContenrProps) => {
  const [isPending, startTransition] = useTransition();
  return (
    <>
      <DataToolbar
        initialSearchValue={search}
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
};

export default AdminUsersContent;
