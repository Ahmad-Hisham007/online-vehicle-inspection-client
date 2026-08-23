import { describe, it, expect } from "vitest";
import {
  getMenuIcon,
  isLogoutItem,
  isBrandItem,
} from "@/app/lib/header-config";

describe("getMenuIcon", () => {
  it("returns the matching icon for known css classes", () => {
    expect(getMenuIcon(["requests-menu"])).toBeTypeOf("function");
    expect(getMenuIcon(["users-menu"])).toBeTypeOf("function");
    expect(getMenuIcon(["logout-menu"])).toBeTypeOf("function");
  });

  it("matches the first known class when multiple are present", () => {
    const icon = getMenuIcon(["admin-menu", "users-menu"]);
    expect(icon).toBeTypeOf("function");
  });

  it("falls back to a default icon for unknown classes", () => {
    expect(getMenuIcon(["unknown-menu"])).toBeTypeOf("function");
  });
});

describe("isLogoutItem", () => {
  it("detects only the logout-menu class", () => {
    expect(isLogoutItem(["logout-menu"])).toBe(true);
    expect(isLogoutItem(["menu-button"])).toBe(false);
    expect(isLogoutItem(["login-menu"])).toBe(false);
    expect(isLogoutItem([])).toBe(false);
  });
});

describe("isBrandItem", () => {
  it("detects brand menu items", () => {
    expect(isBrandItem({ cssClasses: ["uber-menu"] })).toBe(true);
    expect(isBrandItem({ cssClasses: ["requests-menu"] })).toBe(false);
  });
});
