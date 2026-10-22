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

// react-hot-toast default export is a function that can be called directly
vi.mock("react-hot-toast", () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTransition: vi.fn(() => [false, vi.fn()]),
  };
});

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
    dateModified: "2026-08-15T17:14:00",
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
    driverName: "Test User",
    driverEmail: "test@example.com",
    driverPhoneNumber: "+15550100",
    media: { general: [], interior: [], exterior: [], tires: [] },
    certificates: {},
    orderSubtotal: "24",
    assignedInspector: null,
    approvalFields: {},
    author: {
      node: {
        databaseId: 1,
        displayName: "John Doe",
      },
    },
    handlerName: "John Doe",
    handlerSignature: "Signature here",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CertificatesPanel admin actions", () => {
  it("enables Approve for paid and in_progress when certificates are ready", () => {
    for (const status of ["paid", "in_progress"] as InspectionStatus[]) {
      // Need to have approval fields filled and certificates ready for Approve button to show
      const { unmount } = render(
        <CertificatesPanel
          inspection={detail(status, {
            approvalFields: { vehicleMake: "Honda" },
            certificates: { lyft: "data:application/pdf;base64,test" },
          })}
          role="admin"
        />,
      );
      expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
      unmount();
    }
  });

  it("shows Return Inspection for approved/rejected status", () => {
    for (const status of [
      "approved",
      "rejected",
    ] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel inspection={detail(status)} role="admin" />,
      );
      expect(
        screen.getByRole("button", { name: "Return Inspection" }),
      ).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("shows Approve/Reject buttons for other statuses without certificates", async () => {
    const { unmount } = render(
      <CertificatesPanel
        inspection={detail("pending", {
          approvalFields: { vehicleMake: "Honda" },
        })}
        role="admin"
      />,
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
    unmount();
  });

  it("enables Reject for every status except approved/rejected", () => {
    for (const status of [
      "pending",
      "paid",
      "payment_failed",
      "in_progress",
      "cancelled",
    ] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel
          inspection={detail(status, {
            approvalFields: { vehicleMake: "Honda" },
          })}
          role="admin"
        />,
      );
      expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
      unmount();
    }

    // "approved"/"rejected" statuses show "Return Inspection" instead of Approve/Reject
    for (const status of ["approved", "rejected"] as InspectionStatus[]) {
      const { unmount } = render(
        <CertificatesPanel
          inspection={detail(status, {
            approvalFields: { vehicleMake: "Honda" },
          })}
          role="admin"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Return Inspection" }),
      ).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Reject" }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("opens the reject dialog and confirms the mutation", async () => {
    mockReject.mockResolvedValue(undefined);
    render(
      <CertificatesPanel
        inspection={detail("pending", {
          approvalFields: { vehicleMake: "Honda" },
        })}
        role="admin"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByText("Reject inspection")).toBeInTheDocument();

    // Select a field and fill reason (required by RejectDialog validation)
    const select = screen.getByLabelText("Invalid fields") as HTMLSelectElement;
    const hornOption = Array.from(select.options).find((o) => o.text === "Horn");
    if (hornOption) hornOption.selected = true;
    fireEvent.change(select);

    const reasonInput = screen.getByPlaceholderText("Describe what needs to be fixed…");
    fireEvent.change(reasonInput, { target: { value: "Bad horn" } });

    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    // Verify the mutation was called
    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith("234", "1", {
        invalidFields: ["horn"],
        rejectionReason: "Bad horn",
      });
    });
  });

  it("cancel closes the dialog without rejecting", async () => {
    render(
      <CertificatesPanel
        inspection={detail("pending", {
          approvalFields: { vehicleMake: "Honda" },
        })}
        role="admin"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Reject inspection")).not.toBeInTheDocument();
    });
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("shows an error toast when the mutation fails", async () => {
    mockReject.mockRejectedValue(new Error("nope"));
    render(
      <CertificatesPanel
        inspection={detail("pending", {
          approvalFields: { vehicleMake: "Honda" },
        })}
        role="admin"
      />,
    );

    // Open reject dialog
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    // Select a field and fill reason (required by new RejectDialog validation)
    const select = screen.getByLabelText("Invalid fields") as HTMLSelectElement;
    const hornOption = Array.from(select.options).find((o) => o.text === "Horn");
    if (hornOption) hornOption.selected = true;
    fireEvent.change(select);

    const reasonInput = screen.getByPlaceholderText("Describe what needs to be fixed…");
    fireEvent.change(reasonInput, { target: { value: "Bad horn" } });

    // Submit the rejection
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

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