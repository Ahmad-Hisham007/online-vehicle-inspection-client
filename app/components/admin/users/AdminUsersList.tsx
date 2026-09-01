import React, { Suspense } from "react";
import AdminUsersContent from "./AdminUsersContent";
import { listUsers } from "@/app/actions/users";
import AdminPageShell from "../AdminPageShell";
import DataTableSkeleton from "../DataTableSkeleton";

interface AdminUsersListSearchParams {
  searchParams: Promise<{ page?: string; search?: string }>;
}
const AdminUsersList = async ({ searchParams }: AdminUsersListSearchParams) => {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search?.trim() || "";
  const data = await listUsers({ page, perPage: 8, search });
  console.log(data);
  const rows = data.items;
  return (
    <AdminPageShell title={"Users"}>
      <Suspense fallback={<DataTableSkeleton columns={8} />}>
        <AdminUsersContent
          rows={rows}
          page={page}
          search={search}
          total={data.total}
          totalPages={data.totalPages}
        />
        ;
      </Suspense>
    </AdminPageShell>
  );
};

export default AdminUsersList;
