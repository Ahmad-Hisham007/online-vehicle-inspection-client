import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import InspectionCard from "@/app/components/InspectionCard";
import type { InspectionSummary } from "@/app/lib/types";

const mockPush = vi.hoisted(() => vi.fn());
const mockPrefetch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, prefetch: mockPrefetch }),
  usePathname: () => "/dashboard/customer",
}));

function summary(overrides: Partial<InspectionSummary> = {}): InspectionSummary {
  return {
    id: "1",
    licensePlate: "ABC123",
    dateCreated: "2026-08-15T17:14:00",
    inspectionStatus: "pending",
    paymentStatus: "pending",
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("InspectionCard", () => {
  it("renders license plate, formatted date and status", () => {
    render(<InspectionCard inspection={summary()} />);

    expect(screen.getByText("License Plate No.")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("Date Created")).toBeInTheDocument();
    expect(screen.getByText(/08\/15\/26/)).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("is folded by default", () => {
    render(<InspectionCard inspection={summary()} />);

    expect(screen.queryByText("Car details")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Link")).not.toBeInTheDocument();
  });

  it("unfolds to reveal links when chevron is clicked", async () => {
    const user = userEvent.setup();
    render(<InspectionCard inspection={summary()} />);

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.getByText("Car details")).toBeInTheDocument();
    expect(screen.getByText("Payment Link")).toBeInTheDocument();
  });

  it("does not show Payment Link for paid inspections", async () => {
    const user = userEvent.setup();
    render(
      <InspectionCard
        inspection={summary({ paymentStatus: "succeeded", inspectionStatus: "paid" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.queryByText("Payment Link")).not.toBeInTheDocument();
    expect(screen.getByText("Car details")).toBeInTheDocument();
  });

  it("hides Payment Link when inspection status is paid but payment status is pending", async () => {
    const user = userEvent.setup();
    render(
      <InspectionCard
        inspection={summary({ paymentStatus: "pending", inspectionStatus: "paid" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.queryByText("Payment Link")).not.toBeInTheDocument();
    expect(screen.getByText("Car details")).toBeInTheDocument();
  });

  it("navigates to pay page from Payment Link", async () => {
    const user = userEvent.setup();
    render(<InspectionCard inspection={summary()} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    await user.click(screen.getByText("Payment Link"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/customer/pay/1");
  });

  it("navigates to detail page from Car details", async () => {
    const user = userEvent.setup();
    render(<InspectionCard inspection={summary()} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    await user.click(screen.getByText("Car details"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/customer/inspection/1");
  });
});