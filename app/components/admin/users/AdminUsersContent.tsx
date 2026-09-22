"use client";
import { AdminUserRow } from "@/app/lib/types";
import React, { useMemo, useTransition } from "react";
import Link from "next/link";
import DataTable, { DataTableColumn } from "../DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import DataToolbar from "../DataToolbar";

const ROLE_FILTER_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Administrator", value: "administrator" },
  { label: "Inspector", value: "inspector" },
  { label: "Customer", value: "subscriber" },
];

interface AdminUsersContentProps {
  rows: AdminUserRow[];
  search: string;
  role: string | null;
  page: number;
  totalPages: number;
  total: number;
  canEdit: boolean;
}

const ACTION_CLASS =
  "inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20";

const AdminUsersContent = ({
  rows,
  page,
  search,
  role,
  total,
  totalPages,
  canEdit,
}: AdminUsersContentProps) => {
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<DataTableColumn<AdminUserRow>[]>(() => {
    const base: DataTableColumn<AdminUserRow>[] = [
      {
        key: "id",
        header: "ID",
        cell: (u) => <span className="font-medium">{u.id}</span>,
      },
      { key: "role", header: "Role", cell: (u) => u.role },
      { key: "email", header: "Email", cell: (u) => u.email },
      { key: "phone", header: "Phone", cell: (u) => u.phone },
      { key: "firstName", header: "First Name", cell: (u) => u.firstName },
      { key: "lastName", header: "Last Name", cell: (u) => u.lastName },

      {
        key: "active",
        header: "Active",
        cell: (u) => (
          <Checkbox checked={true} aria-label={`${u.email} active`} />
        ),
      },
    ];

    if (canEdit) {
      base.push({
        key: "actions",
        header: "Actions",
        cell: (u) => (
          <Link
            href={`/dashboard/admin/users/${u.id}`}
            className={ACTION_CLASS}
          >
            Edit
          </Link>
        ),
      });
    }

    return base;
  }, [canEdit]);

  return (
    <>
      <DataToolbar
        initialSearchValue={search}
        initialRoleFilter={role}
        filterOptions={ROLE_FILTER_OPTIONS}
        filterParamName="role"
        startTransition={startTransition}
        isPending={isPending}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        search={search}
        page={page}
        totalPages={totalPages}
        total={total}
        isLoading={isPending}
        startTransition={startTransition}
      />
    </>
  );
};

export default AdminUsersContent;
