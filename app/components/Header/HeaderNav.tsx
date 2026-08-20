import { auth } from "@/auth";
import { getMainMenu } from "@/app/lib/menu";
import Header from "./Header";

export default async function HeaderNav() {
  const [menuItems, session] = await Promise.all([getMainMenu(), auth()]);

  const user = session?.user;

  return (
    <Header
      menuItems={menuItems}
      initialAuthStatus={
        user?.accessToken ? "authenticated" : "unauthenticated"
      }
      isAdmin={user?.role === "administrator"}
    />
  );
}