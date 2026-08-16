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
  it("renders title, date radios and status radios including All", () => {
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatus={null}
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

    const all = screen.getByLabelText("All") as HTMLInputElement;
    expect(all.checked).toBe(true);
    expect(screen.getByLabelText("Pending")).toBeInTheDocument();
    expect(screen.getByLabelText("Approved")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancelled")).toBeInTheDocument();
  });

  it("reflects provided initial sort and status", () => {
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="oldest"
        initialStatus="paid"
        onSubmit={mockOnSubmit}
      />,
    );

    expect((screen.getByLabelText("Oldest") as HTMLInputElement).checked).toBe(
      true,
    );
    expect((screen.getByLabelText("Paid") as HTMLInputElement).checked).toBe(
      true,
    );
    expect((screen.getByLabelText("All") as HTMLInputElement).checked).toBe(
      false,
    );
  });

  it("selects a single status radio and submits it", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatus={null}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByLabelText("Oldest"));
    await user.click(screen.getByLabelText("Approved"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith("oldest", "approved");
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("selecting another status replaces the previous selection", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatus="pending"
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByLabelText("In Progress"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith("newest", "in_progress");
  });

  it("submits null status when All is selected", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatus="paid"
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByLabelText("All"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith("newest", null);
  });

  it("closes via the close button without submitting", async () => {
    const user = userEvent.setup();
    render(
      <FilterInspectionsModal
        open
        onOpenChange={mockOnOpenChange}
        initialSortDir="newest"
        initialStatus={null}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
