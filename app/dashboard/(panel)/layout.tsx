import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminPanelMenu } from "@/app/lib/menu";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

const ADMIN_ROLES = ["administrator", "inspector"];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, menuItems] = await Promise.all([auth(), getAdminPanelMenu()]);

  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/dashboard/customer");
  }

  return (
    <section className="flex min-h-screen flex-col bg-muted">
      <div className="flex flex-1">
        <AdminSidebar menuItems={menuItems} />
        <main className="flex-1 overflow-x-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-start px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </section>
  );
}
