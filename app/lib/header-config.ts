import {
  FiArchive,
  FiFileText,
  FiGrid,
  FiLogIn,
  FiLogOut,
  FiMessageCircle,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";

export const BRAND_LOGOS: Record<string, { src: string; alt: string }> = {
  "uber-menu": { src: "/uber.svg", alt: "Uber" },
  "lyft-menu": { src: "/lyft.svg", alt: "Lyft" },
  "turo-menu": { src: "/turo.svg", alt: "Turo" },
};

export const ITEM_ICONS: Record<string, IconType> = {
  "login-menu": FiLogIn,
  "dashboard-menu": FiGrid,
  "admin-menu": FiSettings,
  "logout-menu": FiLogOut,
  "contact-menu": FiMessageCircle,
  "blog-menu": FiFileText,
  "requests-menu": FiFileText,
  "users-menu": FiUsers,
  "archive-menu": FiArchive,
  "proposals-menu": FiMessageCircle,
  "settings-menu": FiSettings,
};

export function getMenuIcon(cssClasses: string[]): IconType {
  for (const cls of cssClasses) {
    if (ITEM_ICONS[cls]) return ITEM_ICONS[cls];
  }
  return FiGrid;
}

export function isLogoutItem(cssClasses: string[]): boolean {
  return cssClasses.includes("logout-menu");
}

export function isBrandItem(item: { cssClasses: string[] }): boolean {
  return item.cssClasses.some((c) => c in BRAND_LOGOS);
}
