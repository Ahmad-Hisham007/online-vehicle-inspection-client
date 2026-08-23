"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import NavLink from "@/app/components/NavLink";
import { getMenuIcon, isLogoutItem } from "@/app/lib/header-config";
import type { NavMenuItem } from "@/app/lib/menu";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  menuItems: NavMenuItem[];
}

const NAV_CLASS =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors";
const NAV_INACTIVE = "text-slate-300 hover:bg-slate-700/60 hover:text-white";
const NAV_ACTIVE = "bg-primary text-white font-medium";

export default function AdminSidebar({ menuItems }: AdminSidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-slate-800 py-6 px-4 text-white md:flex">
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = getMenuIcon(item.cssClasses);

          if (isLogoutItem(item.cssClasses)) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`${NAV_CLASS} ${NAV_INACTIVE} cursor-pointer`}
              >
                {Icon && <Icon className="size-4" />}
                {item.label}
              </button>
            );
          }

          const href = item.path;

          return (
            <NavLink
              key={item.id}
              href={href}
              className={({ isActive }) =>
                cn(NAV_CLASS, isActive ? NAV_ACTIVE : NAV_INACTIVE)
              }
            >
              {Icon && <Icon className="size-4" />}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}