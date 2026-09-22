import React, { Suspense } from "react";
import AdminUsersContent from "./AdminUsersContent";
import { listUsers } from "@/app/actions/users";
import AdminPageShell from "../AdminPageShell";
import DataTableSkeleton from "../DataTableSkeleton";
import { auth } from "@/auth";
import { isAdministrator } from "@/app/lib/access";

interface AdminUsersListSearchParams {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}
const AdminUsersList = async ({ searchParams }: AdminUsersListSearchParams) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search?.trim() || "";
  const role = sp.role?.trim() || null;
  const session = await auth();
  const canEdit = isAdministrator(session?.user?.role);
  const data = await listUsers({ page, perPage: 8, search, role: role ?? undefined });
  const rows = data.items;
  return (
    <AdminPageShell title={"Users"}>
      <Suspense fallback={<DataTableSkeleton columns={7} />}>
        <AdminUsersContent
          rows={rows}
          page={page}
          search={search}
          role={role}
          total={data.total}
          totalPages={data.totalPages}
          canEdit={canEdit}
        />
      </Suspense>
    </AdminPageShell>
  );
};

export default AdminUsersList;
