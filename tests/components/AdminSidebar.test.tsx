import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/admin/requests",
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
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

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn() },
}));

import AdminSidebar from "@/app/components/admin/AdminSidebar";
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

const menuItems: NavMenuItem[] = [
  menuItem(),
  menuItem({
    id: "2",
    databaseId: 2,
    label: "Users",
    url: "/dashboard/admin/users",
    path: "/dashboard/admin/users",
    cssClasses: ["users-menu"],
  }),
  menuItem({
    id: "3",
    databaseId: 3,
    label: "Logout",
    url: "#",
    path: "#",
    cssClasses: ["logout-menu"],
  }),
];

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders menu items", () => {
    render(<AdminSidebar menuItems={menuItems} />);
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders nav links with hrefs", () => {
    render(<AdminSidebar menuItems={menuItems} />);
    const requests = screen.getByText("Requests").closest("a");
    expect(requests).toHaveAttribute("href", "/dashboard/admin/requests");
    const users = screen.getByText("Users").closest("a");
    expect(users).toHaveAttribute("href", "/dashboard/admin/users");
  });

  it("calls signOut when logout button is clicked", async () => {
    const user = userEvent.setup();
    const { signOut } = await import("next-auth/react");
    render(<AdminSidebar menuItems={menuItems} />);
    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(signOut).toHaveBeenCalled();
  });
});