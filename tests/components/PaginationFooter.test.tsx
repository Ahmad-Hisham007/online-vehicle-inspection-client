import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import PaginationFooter from "@/app/components/admin/PaginationFooter";

describe("PaginationFooter", () => {
  it("renders the showing summary", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={5}
        totalItems={42}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Showing 1–10 of 42 items")).toBeInTheDocument();
  });

  it("computes the from–to range correctly", () => {
    render(
      <PaginationFooter
        page={4}
        totalPages={5}
        totalItems={42}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Showing 31–40 of 42 items")).toBeInTheDocument();
  });

  it("clamps the last page range", () => {
    render(
      <PaginationFooter
        page={5}
        totalPages={5}
        totalItems={42}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Showing 41–42 of 42 items")).toBeInTheDocument();
  });

  it("renders an empty summary when there are no items", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={1}
        totalItems={0}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Showing 0 items")).toBeInTheDocument();
  });

  it("shows page numbers and marks the active page", () => {
    render(
      <PaginationFooter
        page={2}
        totalPages={3}
        totalItems={30}
        onPageChange={() => {}}
      />,
    );
    const page2 = screen.getByRole("button", { name: "2" });
    expect(page2).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("calls onPageChange on next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PaginationFooter
        page={1}
        totalPages={3}
        totalItems={30}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous on the first page", () => {
    render(
      <PaginationFooter
        page={1}
        totalPages={3}
        totalItems={30}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  it("disables next on the last page", () => {
    render(
      <PaginationFooter
        page={3}
        totalPages={3}
        totalItems={30}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
