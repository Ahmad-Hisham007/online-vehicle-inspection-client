import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockRefresh = vi.hoisted(() => vi.fn());
const mockReject = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

vi.mock("@/app/actions/admin", () => ({
  rejectInspection: mockReject,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: mockToastSuccess, error: mockToastError },
}));

import CertificatesPanel from "@/app/components/InspectionDetailView/CertificatesPanel";
import type { InspectionDetail, InspectionStatus } from "@/app/lib/types";

function detail(
  status: InspectionStatus,
  overrides: Partial<InspectionDetail> = {},
): InspectionDetail {
  return {
    id: "234",
    licensePlate: "ABC123",
    dateCreated: "2026-08-15T17:14:00",
    inspectionStatus: status,
    paymentStatus: "succeeded",
    vin: "1HGCM82633A004352",
    make: "Honda",
    model: "Accord",
    year: "2020",
    fuelType: "gasoline",
    mileage: "50000",
    color: "Silver",
    location: { country: "USA", state: "AR" },
    companies: ["uber"],
    inspectionDate: "2026-08-15",
    expiryDate: "",
    hostName: "Test User",
    hostEmail: "test@example.com",
    hostPhoneNumber: "555-0100",
    media: { general: [], interior: [], exterior: [], tires: [] },
    certificates: {},
    orderSubtotal: "24",
    approvalFields: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CertificatesPanel admin actions", () => {
  it("enables Approve for paid and in_progress", () => {
    for (const status of ["paid", "in_progress"] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel inspection={detail(status)} role="admin" />,
      );
      expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
      unmount();
    }
  });

  it("disables Approve outside paid/in_progress", () => {
    for (const status of [
      "pending",
      "payment_failed",
      "approved",
      "rejected",
      "cancelled",
    ] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel inspection={detail(status)} role="admin" />,
      );
      expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
      unmount();
    }
  });

  it("enables Reject for every status except paid/in_progress/approved", () => {
    for (const status of [
      "pending",
      "payment_failed",
      "rejected",
      "cancelled",
    ] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel inspection={detail(status)} role="admin" />,
      );
      expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
      unmount();
    }

    for (const status of [
      "paid",
      "in_progress",
      "approved",
    ] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel inspection={detail(status)} role="admin" />,
      );
      expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
      unmount();
    }
  });

  it("opens the reject dialog and confirms the mutation", async () => {
    mockReject.mockResolvedValue(undefined);
    render(<CertificatesPanel inspection={detail("pending")} role="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByText("Reject inspection")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith("234");
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("cancel closes the dialog without rejecting", async () => {
    render(<CertificatesPanel inspection={detail("pending")} role="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Reject inspection")).not.toBeInTheDocument();
    });
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("shows an error toast when the mutation fails", async () => {
    mockReject.mockRejectedValue(new Error("nope"));
    render(<CertificatesPanel inspection={detail("pending")} role="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("renders no admin actions for the customer role", () => {
    render(<CertificatesPanel inspection={detail("pending")} role="customer" />);
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reject" }),
    ).not.toBeInTheDocument();
  });
});