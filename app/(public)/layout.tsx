import Header from "@/app/components/Header/Header";
import { getMainMenu } from "@/app/lib/menu";

export const revalidate = 3600;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = await getMainMenu();

  return (
    <>
      <Header menuItems={menuItems} initialAuthStatus="unauthenticated" />
      <main className="flex-1">{children}</main>
    </>
  );
}