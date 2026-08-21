import Header from "./Header";
import HeaderMenuSkeleton from "./HeaderMenuSkeleton";
import type { NavMenuItem } from "@/app/lib/menu";

interface HeaderNavProps {
  menuItems?: NavMenuItem[];
  session?: {
    user?: {
      accessToken?: string;
      role?: string;
    };
  } | null;
  isLoading?: boolean;
}

export default function HeaderNav({ 
  menuItems = [], 
  session = null, 
  isLoading = false 
}: HeaderNavProps) {
  if (isLoading) {
    return (
      <>
        <HeaderMenuSkeleton variant="desktop" />
        <HeaderMenuSkeleton variant="mobile" isOpen={true} />
      </>
    );
  }

  const user = session?.user;

  return (
    <Header
      menuItems={menuItems}
      initialAuthStatus={
        user?.accessToken ? "authenticated" : "unauthenticated"
      }
      session={session}
    />
  );
}