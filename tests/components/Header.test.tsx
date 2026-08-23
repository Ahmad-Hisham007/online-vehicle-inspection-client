import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockPush = vi.hoisted(() => vi.fn());
const mockPrefetch = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => ({ value: "/dashboard/admin/requests" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
  useRouter: () => ({ push: mockPush, prefetch: mockPrefetch }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: React.ComponentProps<"img">) =>
    React.createElement("img", { src: src as string, alt }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { accessToken: "token", role: "administrator" },
    },
    status: "authenticated",
  }),
  signOut: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn() },
}));

vi.mock("@/app/components/NavLink", () => ({
  default: ({
    href,
    className,
    children,
    ...props
  }: React.ComponentProps<"a">) =>
    React.createElement("a", { href: href as string, className, ...props }, children),
}));

vi.mock("@/app/components/Header/LanguageSelector", () => ({
  default: () => React.createElement("div", { "data-testid": "language-selector" }),
}));

import Header from "@/app/components/Header/Header";
import type { NavMenuItem } from "@/app/lib/menu";

function menuItem(overrides: Partial<NavMenuItem> = {}): NavMenuItem {
  return {
    id: "1",
    databaseId: 1,
    label: "Requests",
    url: "/dashboard/admin/requests",
    path: "/dashboard/admin/requests",
    target: null,
    parentId: null,
    order: 1,
    cssClasses: ["requests-menu"],
    childItems: [],
    ...overrides,
  };
}

const menus = {
  mainMenu: [menuItem({ id: "m1", label: "Home", path: "/" })],
  adminSiteMenu: [
    menuItem({ id: "a1", label: "Dashboard", path: "/dashboard" }),
    menuItem({
      id: "a2",
      label: "Logout",
      path: "#",
      cssClasses: ["logout-menu"],
    }),
  ],
  adminPanelMenu: [
    menuItem({ id: "r1", label: "Requests", path: "/dashboard/admin/requests" }),
    menuItem({ id: "r2", label: "Users", path: "/dashboard/admin/users" }),
    menuItem({
      id: "r3",
      label: "Logout",
      path: "#",
      cssClasses: ["logout-menu"],
    }),
  ],
};

describe("Header", () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.clearAllMocks();
    mockPathname.value = "/dashboard/admin/requests";
  });

  it("renders the admin panel header with page title on admin routes", () => {
    render(<Header menus={menus} />);
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
  });

  it("renders the standard header with logo on non-admin routes", () => {
    mockPathname.value = "/dashboard";
    render(<Header menus={menus} />);
    expect(
      screen.getByRole("img", { name: /website logo/i }),
    ).toBeInTheDocument();
  });

  it("shows admin panel menu items in the mobile drawer on admin routes", async () => {
    const user = userEvent.setup();
    render(<Header menus={menus} />);
    await user.click(screen.getByRole("button", { name: /toggle admin menu/i }));
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders admin site menu on the admin inspection detail route (standard header)", () => {
    mockPathname.value = "/dashboard/admin/inspection/123";
    render(<Header menus={menus} />);
    expect(
      screen.getByRole("img", { name: /website logo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});