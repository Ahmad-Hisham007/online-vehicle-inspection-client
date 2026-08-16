"use client";

import { Fragment, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  FiFileText,
  FiGrid,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import type { NavMenuItem } from "@/app/lib/menu";

const BRAND_LOGOS: Record<string, { src: string; alt: string }> = {
  "uber-menu": { src: "/uber.svg", alt: "Uber" },
  "lyft-menu": { src: "/lyft.svg", alt: "Lyft" },
  "turo-menu": { src: "/turo.svg", alt: "Turo" },
};

const AUTH_CLASSES = ["login-menu", "dashboard-menu", "logout-menu"];

const ITEM_ICONS: Record<string, IconType> = {
  "login-menu": FiLogIn,
  "dashboard-menu": FiGrid,
  "logout-menu": FiLogOut,
  "contact-menu": FiMessageCircle,
  "blog-menu": FiFileText,
};

interface HeaderProps {
  menuItems?: NavMenuItem[];
}

const Header = ({ menuItems = [] }: HeaderProps) => {
  const [selectedLang, setSelectedLang] = useState("En");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const authPending = status === "loading";

  const languages = [
    { code: "En", flag: "/us.png" },
    { code: "Es", flag: "/es.png" },
    { code: "Ch", flag: "/cn.png" },
  ];

  const currentLang =
    languages.find((l) => l.code === selectedLang) || languages[0];

  const visibleItems = menuItems.filter((item) => {
    const classes = item.cssClasses;
    if (authPending && classes.some((c) => AUTH_CLASSES.includes(c))) {
      return false;
    }
    if (classes.includes("login-menu")) return !authenticated;
    if (classes.includes("dashboard-menu") || classes.includes("logout-menu")) {
      return authenticated;
    }
    return true;
  });

  const isBrand = (item: NavMenuItem) =>
    item.cssClasses.some((c) => c in BRAND_LOGOS);

  const firstBrand = visibleItems.findIndex(isBrand);
  const before =
    firstBrand === -1 ? visibleItems : visibleItems.slice(0, firstBrand);
  const brands = visibleItems.filter(isBrand);
  const after =
    firstBrand === -1
      ? []
      : visibleItems.slice(firstBrand).filter((i) => !isBrand(i));

  const renderItem = (item: NavMenuItem) => {
    const classes = item.cssClasses.join(" ");
    const Icon = ITEM_ICONS[classes];
    const baseClass =
      "flex items-center gap-2 hover:text-primary transition-colors";

    if (classes.includes("login-menu")) {
      return (
        <a href="/login" className={baseClass}>
          {Icon && <Icon className="size-4" />}
          {item.label}
        </a>
      );
    }

    if (classes.includes("dashboard-menu")) {
      return (
        <a href="/dashboard" className={baseClass}>
          {Icon && <Icon className="size-4" />}
          {item.label}
        </a>
      );
    }

    if (classes.includes("logout-menu")) {
      return (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`${baseClass} cursor-pointer`}
        >
          {Icon && <Icon className="size-4" />}
          {item.label}
        </button>
      );
    }

    // Contact / Blog — not ready yet, render-only for now
    if (classes.includes("contact-menu") || classes.includes("blog-menu")) {
      return (
        <a href="#" className={`${baseClass} ${classes}`}>
          {Icon && <Icon className="size-4" />}
          {item.label}
        </a>
      );
    }

    const href =
      item.path && !item.path.startsWith("http") ? item.path : item.url;

    return (
      <a href={href} className={`${baseClass} ${classes}`}>
        {Icon && <Icon className="size-4" />}
        {item.label}
      </a>
    );
  };

  const renderMobileItem = (item: NavMenuItem) => {
    const classes = item.cssClasses.join(" ");
    const Icon = ITEM_ICONS[classes];
    const rowClass =
      "flex items-center justify-center gap-3 py-4 w-full bg-white border-b border-gray-100/80 text-teal-950 text-base font-medium";

    if (classes.includes("login-menu")) {
      return (
        <a href="/login" className={rowClass}>
          {Icon && <Icon className="size-5" />}
          {item.label}
        </a>
      );
    }

    if (classes.includes("dashboard-menu")) {
      return (
        <a href="/dashboard" className={rowClass}>
          {Icon && <Icon className="size-5" />}
          {item.label}
        </a>
      );
    }

    if (classes.includes("logout-menu")) {
      return (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`${rowClass} cursor-pointer`}
        >
          {Icon && <Icon className="size-5" />}
          {item.label}
        </button>
      );
    }

    // Contact / Blog — not ready yet, render-only for now
    if (classes.includes("contact-menu") || classes.includes("blog-menu")) {
      return (
        <a href="#" className={`${rowClass} ${classes}`}>
          {Icon && <Icon className="size-5" />}
          {item.label}
        </a>
      );
    }

    const href =
      item.path && !item.path.startsWith("http") ? item.path : item.url;

    return (
      <a href={href} className={`${rowClass} ${classes}`}>
        {Icon && <Icon className="size-5" />}
        {item.label}
      </a>
    );
  };

  return (
    <header className="w-full bg-white shadow-sm relative z-50">
      <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* --- Left Section: Shadcn Language Dropdown with Next.js Image --- */}
          <div className="flex-1 flex justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-md transition-colors outline-none focus:ring-2 focus:ring-gray-200">
                <div className="w-6 h-4 relative rounded-sm overflow-hidden border border-gray-100 flex items-center">
                  <Image
                    src={currentLang.flag}
                    alt={`${currentLang.code} flag`}
                    width={24}
                    height={16}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium text-gray-700 text-base">
                  {currentLang.code}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-32 bg-white">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="w-6 h-4 relative rounded-sm overflow-hidden border border-gray-100 flex items-center">
                      <Image
                        src={lang.flag}
                        alt={`${lang.code} flag`}
                        width={24}
                        height={16}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {lang.code}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* --- Center Section: Logo --- */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 cursor-pointer">
              <Image
                src="/Online_Vehicle_Inspection_Logo_No_BG.png"
                width={140}
                height={70}
                alt="Website Logo"
                className="object-contain"
                style={{ width: "auto", height: "auto", maxHeight: "50px" }}
              />
            </h1>
          </div>

          {/* --- Right Section: Hamburger Menu --- */}
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
              {/* Single line elements container */}
              <div className="flex justify-end items-center gap-6 text-sm font-medium text-gray-700">
                {before.map((item) => (
                  <Fragment key={item.id}>{renderItem(item)}</Fragment>
                ))}

                {/* Brand Logos (from WordPress menu, render-only) */}
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
                  <Fragment key={item.id}>{renderItem(item)}</Fragment>
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
              <Fragment key={item.id}>{renderMobileItem(item)}</Fragment>
            ))}

            {/* Brand / partner logos (from WordPress menu, render-only) */}
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
              <Fragment key={item.id}>{renderMobileItem(item)}</Fragment>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
