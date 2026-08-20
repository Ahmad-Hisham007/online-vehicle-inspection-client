"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/app/store/uiStore";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

interface NavLinkProps
  extends Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "onClick"
  > {
  href: string;
  activeClassName?: string;
  pendingClassName?: string;
  className?: string | ((args: { isActive: boolean }) => string);
  onNavigate?: () => void;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}

const isPrefetchable = (href: string): boolean =>
  href !== "#" && !href.startsWith("http") && href.length > 0;

const isHrefActive = (pathname: string, href: string): boolean => {
  if (href === "#" || href.startsWith("http")) return false;
  const target =
    href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
};

const NavLink = ({
  href,
  className,
  activeClassName,
  pendingClassName = "opacity-60",
  onNavigate,
  onClick,
  children,
  ...rest
}: NavLinkProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const setNavPending = useUIStore((s) => s.setNavPending);

  useEffect(() => {
    setNavPending(isPending);
    return () => {
      if (isPending) setNavPending(false);
    };
  }, [isPending, setNavPending]);

  const isActive = isHrefActive(pathname, href);
  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  const combined = [
    resolvedClassName ?? "",
    isActive && activeClassName ? activeClassName : "",
    isPending ? pendingClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prefetch = () => {
    if (isPrefetchable(href)) router.prefetch(href);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (href === "#" || href.startsWith("http")) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate?.();
    startTransition(() => {
      router.push(href);
    });
  };

  useEffect(() => {
    if (isPrefetchable(href)) router.prefetch(href);
  }, [href, router]);

  return (
    <a
      href={href}
      className={combined || undefined}
      {...rest}
      onClick={handleClick}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </a>
  );
};

export default NavLink;