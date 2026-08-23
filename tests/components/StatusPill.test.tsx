import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import StatusPill from "@/app/components/admin/StatusPill";

describe("StatusPill", () => {
  it("renders the correct label text", () => {
    render(<StatusPill status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders a pill for every inspection status", () => {
    for (const status of [
      "pending",
      "paid",
      "payment_failed",
      "in_progress",
      "approved",
      "rejected",
      "cancelled",
    ] as const) {
      const { unmount } = render(<StatusPill status={status} />);
      expect(screen.getByText((c) => c.length > 0)).toBeInTheDocument();
      unmount();
    }
  });
});