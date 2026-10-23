import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isStaff } from "@/app/lib/access";
import { getCurrentUser } from "@/app/actions/users";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import CurrentUserSettingsForm from "@/app/components/admin/CurrentUserSettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.wpId || !isStaff(session?.user?.role)) {
    notFound();
  }

  const user = await getCurrentUser(String(session.user.wpId));

  return (
    <AdminPageShell title="Settings">
      <CurrentUserSettingsForm user={user} />
    </AdminPageShell>
  );
}
