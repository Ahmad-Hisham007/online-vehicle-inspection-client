import AdminUsersList from "@/app/components/admin/users/AdminUsersList";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}
export default function UsersPage({ searchParams }: PageProps) {
  return <AdminUsersList searchParams={searchParams} />;
}
