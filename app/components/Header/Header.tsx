"use client";

import { Fragment, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { FiMenu, FiX } from "react-icons/fi";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import NavLink from "@/app/components/NavLink";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import HeaderMenuSkeleton from "./HeaderMenuSkeleton";
import LanguageSelector from "./LanguageSelector";
import {
  BRAND_LOGOS,
  getMenuIcon,
  isLogoutItem,
  isBrandItem,
} from "@/app/lib/header-config";
import type { NavMenuItem } from "@/app/lib/menu";

const ADMIN_ROLES = ["administrator", "inspector"];

interface HeaderProps {
  menus: {
    mainMenu: NavMenuItem[];
    adminSiteMenu: NavMenuItem[];
    adminPanelMenu: NavMenuItem[];
  };
}

const Header = ({ menus }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { data: clientSession, status } = useSession();
  const effectiveSession = clientSession;
  const authLoading = status === "loading";

  const isAdminRole = ADMIN_ROLES.includes(effectiveSession?.user?.role ?? "");
  const isAdminPanelRoute =
    pathname.startsWith("/dashboard/admin") &&
    !pathname.startsWith("/dashboard/admin/inspection");

  const authenticated = Boolean(effectiveSession?.user?.accessToken);

  const closeMenu = () => setIsMenuOpen(false);

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

  const activeMenu: NavMenuItem[] = isAdminPanelRoute
    ? menus.adminPanelMenu
    : isAdminRole
      ? menus.adminSiteMenu
      : menus.mainMenu;

  const visibleItems = useMemo(
    () =>
      activeMenu.filter((item) => {
        const classes = item.cssClasses;
        if (classes.includes("login-menu")) return !authenticated;
        if (
          classes.includes("dashboard-menu") ||
          classes.includes("logout-menu") ||
          isLogoutItem(classes)
        ) {
          return authenticated;
        }
        if (classes.includes("admin-menu")) return isAdminRole;
        return true;
      }),
    [activeMenu, authenticated, isAdminRole],
  );

  const { before, brands, after } = useMemo(() => {
    const firstBrand = visibleItems.findIndex(isBrandItem);
    return {
      before:
        firstBrand === -1 ? visibleItems : visibleItems.slice(0, firstBrand),
      brands: visibleItems.filter(isBrandItem),
      after:
        firstBrand === -1
          ? []
          : visibleItems.slice(firstBrand).filter((i) => !isBrandItem(i)),
    };
  }, [visibleItems]);

  if (authLoading) {
    return (
      <>
        <HeaderMenuSkeleton variant="desktop" />
        <HeaderMenuSkeleton variant="mobile" isOpen={true} />
      </>
    );
  }

  const renderMenuItem = (item: NavMenuItem, isMobile = false) => {
    const classes = item.cssClasses.join(" ");
    const Icon = getMenuIcon(item.cssClasses);

    const baseClass = isMobile
      ? "flex items-center justify-center gap-3 py-4 w-full bg-white border-b border-gray-100/80 text-teal-950 text-base font-medium"
      : "flex items-center gap-2 hover:text-primary transition-colors";

    const activeClass = isMobile ? "text-primary bg-teal-50!" : "text-primary";
    const iconSize = isMobile ? "size-5" : "size-4";

    // Logout / action button
    if (isLogoutItem(item.cssClasses)) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${baseClass} cursor-pointer ${classes}`}
        >
          {Icon && <Icon className={iconSize} />}
          {item.label}
        </button>
      );
    }

    // Internal link
    const href = item.path;

    return (
      <NavLink
        key={item.id}
        href={href}
        className={`${baseClass} ${classes}`}
        activeClassName={activeClass}
        onNavigate={closeMenu}
      >
        {Icon && <Icon className={iconSize} />}
        {item.label}
      </NavLink>
    );
  };

  const renderAdminPanelHeader = () => {
    const currentItem = menus.adminPanelMenu.find((item) => {
      const target =
        item.path.length > 1 && item.path.endsWith("/")
          ? item.path.slice(0, -1)
          : item.path;
      return pathname === target || pathname.startsWith(`${target}/`);
    });
    const pageTitle = currentItem?.label ?? "Admin";

    return (
      <header className="w-full bg-white shadow-sm relative z-50">
        <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-1 flex justify-start">
              <LanguageSelector />
            </div>

            <h1 className="flex-1 text-center text-lg font-semibold text-primary">
              {pageTitle}
            </h1>

            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-50 transition-colors md:hidden"
                aria-label="Toggle admin menu"
              >
                {isMenuOpen ? (
                  <FiX className="w-7 h-7 text-gray-800" />
                ) : (
                  <FiMenu className="w-7 h-7 text-gray-800" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer (<md) — admin panel menu items */}
        {isMenuOpen && (
          <div className="fixed top-20 left-0 w-full min-h-[calc(100dvh-5rem)] bg-[#f8f9fa] overflow-y-auto md:hidden z-50">
            <div className="flex flex-col w-full">
              {menus.adminPanelMenu.map((item) => (
                <Fragment key={item.id}>
                  {renderMenuItem(item, true)}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </header>
    );
  };

  const renderStandardHeader = () => (
    <header className="w-full bg-white shadow-sm relative z-50">
      <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-1 flex justify-start">
            <LanguageSelector />
          </div>

          <div className="flex-1 flex justify-center">
            <NavLink href="/" aria-label="Go to homepage" className="cursor-pointer">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">
                <Image
                  src="/Online_Vehicle_Inspection_Logo_No_BG.png"
                  width={140}
                  height={70}
                  alt="Website Logo"
                  className="object-contain"
                  style={{ width: "auto", height: "auto", maxHeight: "50px" }}
                />
              </h1>
            </NavLink>
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-50 rounded-md transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <FiX className="w-7 h-7 text-gray-800" />
              ) : (
                <FiMenu className="w-7 h-7 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop dropdown panel (md+) */}
      <div
        className={`hidden md:grid absolute top-full left-0 w-full grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <Card className="rounded-none border-y border-gray-200 bg-gray-50">
            <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-end items-center gap-6 text-sm font-medium text-gray-700">
                {before.map((item) => (
                  <Fragment key={item.id}>{renderMenuItem(item)}</Fragment>
                ))}

                {brands.length > 0 && (
                  <div className="flex items-center gap-6 ml-2 border-l pl-6 border-gray-200">
                    {brands.map((item) => {
                      const logo = item.cssClasses
                        .map((c) => BRAND_LOGOS[c])
                        .find(Boolean);
                      return (
                        <a
                          key={item.id}
                          href="#"
                          aria-label={item.label}
                          title={item.label}
                          className={`flex items-center hover:opacity-80 transition-opacity ${item.cssClasses.join(" ")}`}
                        >
                          {logo && (
                            <Image
                              src={logo.src}
                              alt={logo.alt}
                              width={120}
                              height={40}
                              className="object-contain"
                              style={{
                                width: "auto",
                                height: "auto",
                                maxHeight: 17,
                              }}
                            />
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}

                {after.map((item) => (
                  <Fragment key={item.id}>{renderMenuItem(item)}</Fragment>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile navigation drawer (<md) */}
      {isMenuOpen && (
        <div className="fixed top-20 left-0 w-full min-h-[calc(100dvh-5rem)] bg-[#f8f9fa] overflow-y-auto md:hidden z-50">
          <div className="flex flex-col w-full">
            {before.map((item) => (
              <Fragment key={item.id}>{renderMenuItem(item, true)}</Fragment>
            ))}

            {brands.map((item) => {
              const logo = item.cssClasses
                .map((c) => BRAND_LOGOS[c])
                .find(Boolean);
              return (
                <a
                  key={item.id}
                  href="#"
                  aria-label={item.label}
                  title={item.label}
                  className={`flex items-center justify-center py-6 w-full bg-white border-b border-gray-100/80 ${item.cssClasses.join(" ")}`}
                >
                  {logo && (
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={120}
                      height={40}
                      className="object-contain"
                      style={{ width: "auto", height: "auto", maxHeight: 18 }}
                    />
                  )}
                </a>
              );
            })}

            {after.map((item) => (
              <Fragment key={item.id}>{renderMenuItem(item, true)}</Fragment>
            ))}
          </div>
        </div>
      )}
    </header>
  );

  return isAdminPanelRoute ? renderAdminPanelHeader() : renderStandardHeader();
};

export default Header;