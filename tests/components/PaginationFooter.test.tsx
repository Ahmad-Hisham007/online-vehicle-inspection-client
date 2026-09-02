import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import PaginationFooter from "@/app/components/admin/PaginationFooter";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/dashboard/admin/archive",
}));

describe("PaginationFooter", () => {
  it("renders the showing summary", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={5}
        total={42}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByText("Showing 1–10 of 42 items")).toBeInTheDocument();
  });

  it("computes the from–to range correctly", () => {
    render(
      <PaginationFooter
        page={4}
        totalPages={5}
        total={42}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByText("Showing 31–40 of 42 items")).toBeInTheDocument();
  });

  it("clamps the last page range", () => {
    render(
      <PaginationFooter
        page={5}
        totalPages={5}
        total={42}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByText("Showing 41–42 of 42 items")).toBeInTheDocument();
  });

  it("renders an empty summary when there are no items", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={1}
        total={0}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByText("Showing 0 items")).toBeInTheDocument();
  });

  it("shows page numbers and marks the active page", () => {
    render(
      <PaginationFooter
        page={2}
        totalPages={3}
        total={30}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    const page2 = screen.getByRole("button", { name: "2" });
    expect(page2).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("navigates on next", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(
      <PaginationFooter
        page={1}
        totalPages={3}
        total={30}
        pageSize={10}
        isPending={false}
        startTransition={(fn) => fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/admin/archive?page=2");
  });

  it("disables previous on the first page", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={3}
        total={30}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  it("disables next on the last page", () => {
    render(
      <PaginationFooter
        page={3}
        totalPages={3}
        total={30}
        pageSize={10}
        isPending={false}
        startTransition={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
