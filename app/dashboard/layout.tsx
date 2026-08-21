import { auth } from "@/auth";
import { getMainMenu } from "@/app/lib/menu";
import HeaderNav from "@/app/components/Header/HeaderNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuItems, session] = await Promise.all([getMainMenu(), auth()]);

  return (
    <>
      <HeaderNav menuItems={menuItems} session={session} />
      <main className="flex-1">{children}</main>
    </>
  );
}