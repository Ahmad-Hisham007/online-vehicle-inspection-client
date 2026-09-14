import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isAdministrator } from "@/app/lib/access";
import AdminPageShell from "@/app/components/admin/AdminPageShell";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();
  if (!isAdministrator(session?.user?.role)) {
    notFound();
  }

  const { id } = await params;

  return (
    <AdminPageShell title="Edit user">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Editing user #{id}. The form will be added next.
        </p>
        <Link
          href="/dashboard/admin/users"
          className="mt-4 inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Back to users
        </Link>
      </div>
    </AdminPageShell>
  );
}
