import { getMainMenu } from "@/app/lib/menu";
import Header from "./Header";

export default async function HeaderNav() {
  const menuItems = await getMainMenu();

  return <Header menuItems={menuItems} />;
}