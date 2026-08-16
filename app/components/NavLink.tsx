"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

interface NavLinkProps
  extends Omit<LinkProps, "href" | "className" | "onClick"> {
  href: string;
  activeClassName?: string;
  className?: string | ((args: { isActive: boolean }) => string);
  onNavigate?: () => void;
  onClick?: LinkProps["onClick"];
}

const isHrefActive = (pathname: string, href: string): boolean => {
  if (href === "#" || href.startsWith("http")) return false;
  const target = href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
};

const NavLink = ({
  href,
  className,
  activeClassName,
  onNavigate,
  onClick,
  children,
  ...rest
}: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = isHrefActive(pathname, href);
  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;
  const combined = `${resolvedClassName ?? ""}${
    isActive && activeClassName ? ` ${activeClassName}` : ""
  }`.trim();

  return (
    <Link
      href={href}
      className={combined || undefined}
      onClick={(event) => {
        onNavigate?.();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default NavLink;