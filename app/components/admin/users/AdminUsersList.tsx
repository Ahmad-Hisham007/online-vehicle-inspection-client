import React, { Suspense } from "react";
import AdminUsersContent from "./AdminUsersContent";
import { listUsers } from "@/app/actions/users";
import AdminPageShell from "../AdminPageShell";
import DataTableSkeleton from "../DataTableSkeleton";
import { auth } from "@/auth";
import { isAdministrator } from "@/app/lib/access";

interface AdminUsersListSearchParams {
  searchParams: Promise<{ page?: string; search?: string }>;
}
const AdminUsersList = async ({ searchParams }: AdminUsersListSearchParams) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search?.trim() || "";
  const session = await auth();
  const canEdit = isAdministrator(session?.user?.role);
  const data = await listUsers({ page, perPage: 8, search });
  const rows = data.items;
  return (
    <AdminPageShell title={"Users"}>
      <Suspense fallback={<DataTableSkeleton columns={7} />}>
        <AdminUsersContent
          rows={rows}
          page={page}
          search={search}
          total={data.total}
          totalPages={data.totalPages}
          canEdit={canEdit}
        />
      </Suspense>
    </AdminPageShell>
  );
};

export default AdminUsersList;
