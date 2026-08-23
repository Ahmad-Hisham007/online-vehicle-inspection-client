import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href: href as string, ...props }, children),
}));

import InspectionPagination from "@/app/dashboard/(site)/customer/_components/InspectionPagination";

describe("InspectionPagination", () => {
  it("returns null when there is a single page", () => {
    const { container } = render(
      <InspectionPagination page={1} totalPages={1} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders numbered links preserving filter query params", () => {
    render(
      <InspectionPagination
        page={2}
        totalPages={3}
        status="paid"
        sortDir="oldest"
      />,
    );

    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/dashboard/customer?status=paid&sort=oldest",
    );
    const page2 = screen.getByRole("link", { name: "2" });
    expect(page2).toHaveAttribute("aria-current", "page");
    expect(page2).toHaveAttribute(
      "href",
      "/dashboard/customer?status=paid&sort=oldest&page=2",
    );
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/dashboard/customer?status=paid&sort=oldest&page=3",
    );
  });

  it("marks previous as disabled and next enabled on the first page", () => {
    render(<InspectionPagination page={1} totalPages={5} />);

    expect(screen.getByRole("link", { name: "Prev" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/dashboard/customer?page=2",
    );
  });

  it("marks next as disabled on the last page", () => {
    render(<InspectionPagination page={5} totalPages={5} />);

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "Prev" })).toHaveAttribute(
      "href",
      "/dashboard/customer?page=4",
    );
  });
});
