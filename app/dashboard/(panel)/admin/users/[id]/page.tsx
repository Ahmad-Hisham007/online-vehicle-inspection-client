import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdministrator } from "@/app/lib/access";
import { getUser } from "@/app/actions/users";
import EditUserForm from "@/app/components/admin/users/EditUserForm";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();
  if (!isAdministrator(session?.user?.role)) {
    notFound();
  }

  const { id } = await params;

  const user = await getUser(id).catch(() => null);
  if (!user) {
    notFound();
  }

  return <EditUserForm user={user} />;
}
