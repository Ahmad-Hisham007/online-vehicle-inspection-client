import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import FilterInspectionsModal from "@/app/components/FilterInspectionsModal";

const mockOnOpenChange = vi.fn();
const mockOnSubmit = vi.fn();

beforeEach(() => {
  mockOnOpenChange.mockClear();
  mockOnSubmit.mockClear();
});

describe("FilterInspectionsModal", () => {
  it("renders title, date radios and status checkboxes", () => {
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatuses={[]}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText("Filter inspections")).toBeInTheDocument();
    expect(screen.getByText("By Date")).toBeInTheDocument();
    expect(screen.getByText("By status")).toBeInTheDocument();

    const newest = screen.getByLabelText("Newest") as HTMLInputElement;
    const oldest = screen.getByLabelText("Oldest") as HTMLInputElement;
    expect(newest.checked).toBe(true);
    expect(oldest.checked).toBe(false);

    expect(screen.getByLabelText("Pending")).toBeInTheDocument();
    expect(screen.getByLabelText("Approved")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancelled")).toBeInTheDocument();
  });

  it("reflects provided initial sort and statuses", () => {
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="oldest"
        initialStatuses={["paid", "rejected"]}
        onSubmit={mockOnSubmit}
      />,
    );

    expect((screen.getByLabelText("Oldest") as HTMLInputElement).checked).toBe(
      true,
    );
    const paid = screen.getByLabelText("Paid") as HTMLButtonElement;
    const rejected = screen.getByLabelText("Rejected") as HTMLButtonElement;
    const pending = screen.getByLabelText("Pending") as HTMLButtonElement;
    expect(paid.getAttribute("data-state")).toBe("checked");
    expect(rejected.getAttribute("data-state")).toBe("checked");
    expect(pending.getAttribute("data-state")).toBe("unchecked");
  });

  it("submits selected sort dir and statuses then closes", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatuses={[]}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByLabelText("Oldest"));
    await user.click(screen.getByLabelText("Approved"));
    await user.click(screen.getByLabelText("In Progress"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith("oldest", [
      "approved",
      "in_progress",
    ]);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("unchecking a status removes it from selection", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatuses={["paid"]}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByLabelText("Paid"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith("newest", []);
  });

  it("closes via the close button without submitting", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatuses={[]}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});