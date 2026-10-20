import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import InspectionDetailView from "@/app/components/InspectionDetailView/InspectionDetailView";
import type { InspectionDetail } from "@/app/lib/types";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/app/actions/admin", () => ({
  rejectInspection: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, style, className }: React.ComponentProps<"img">) =>
    React.createElement("img", {
      src,
      alt,
      width,
      height,
      style,
      className,
    }),
}));

function detail(overrides: Partial<InspectionDetail> = {}): InspectionDetail {
  return {
    id: "1",
    licensePlate: "ABC123",
    dateCreated: "2026-08-15T17:14:00",
    dateModified: "2026-08-15T17:14:00",
    inspectionStatus: "pending",
    paymentStatus: "pending",
    vin: "1HGCM82633A004352",
    make: "Honda",
    model: "Accord",
    year: "2020",
    fuelType: "gasoline",
    mileage: "50000",
    color: "Silver",
    location: { country: "USA", state: "AR" },
    companies: ["uber", "lyft"],
    inspectionDate: "2026-08-15",
    expiryDate: "",
    hostName: "Test User",
    hostEmail: "test@example.com",
    hostPhoneNumber: "555-0100",
    driverName: "Test User",
    driverEmail: "test@example.com",
    media: {
      general: [
        { label: "Odometer", url: "https://rideshareinspection.b-cdn.net/odo", type: "image" },
        { label: "Horn", url: "https://rideshareinspection.b-cdn.net/horn", type: "video" },
      ],
      interior: [],
      exterior: [],
      tires: [
        {
          label: "Left Front Tire",
          url: "https://rideshareinspection.b-cdn.net/tire-lf",
          type: "image",
        },
      ],
    },
    certificates: {},
    orderSubtotal: "63",
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
  mockPush.mockClear();
});

describe("InspectionDetailView", () => {
  it("renders header, handler name and dates", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(screen.getByText("Car details")).toBeInTheDocument();
    // Handler name appears in the "Prosessed By" header
    expect(screen.getByText(/Prosessed By/)).toBeInTheDocument();
    // handlerName renders in the banner AND author displayName in the User spec row
    expect(screen.getAllByText("John Doe").length).toBe(2);
    // dateModified + dateCreated rows (same date in fixture)
    expect(screen.getAllByText(/08\/15\/26/).length).toBe(2);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders specification rows with location name", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(screen.getByText("License plate")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("VIN")).toBeInTheDocument();
    expect(screen.getByText("1HGCM82633A004352")).toBeInTheDocument();
    expect(screen.getByText("Arkansas (USA)")).toBeInTheDocument();
    expect(screen.getByText("50000")).toBeInTheDocument();
    expect(screen.getByText("Registration expiration")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders expiry date when populated", () => {
    render(
      <InspectionDetailView
        inspection={detail({ expiryDate: "2027-08-15" })}
        role="customer"
      />,
    );

    // expiryDate is formatted as MM/YY by formatInspectionDate
    expect(screen.getByText("08/15/27")).toBeInTheDocument();
  });

  it("renders selected companies", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(screen.getByText("Selected companies")).toBeInTheDocument();
    expect(document.querySelector('img[src="/company-logos/uber.png"]')).not.toBeNull();
    expect(document.querySelector('img[src="/company-logos/lyft.png"]')).not.toBeNull();
  });

  it("renders media gallery with active General tab", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Interior")).toBeInTheDocument();
    expect(screen.getByText("Exterior")).toBeInTheDocument();
    expect(screen.getByText("Tires")).toBeInTheDocument();

    expect(screen.getByAltText("Odometer")).toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeNull();
    expect(screen.queryByAltText("Left Front Tire")).not.toBeInTheDocument();
  });

  it("switches media tabs", async () => {
    const user = userEvent.setup();
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    await user.click(screen.getByText("Tires"));

    expect(screen.getByAltText("Left Front Tire")).toBeInTheDocument();
  });

  it("shows a payment message when inspection is not approved", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(
      screen.getByText("This inspection requires payment."),
    ).toBeInTheDocument();
  });

  it("shows certificate links when approved", () => {
    render(
      <InspectionDetailView
        inspection={detail({
          inspectionStatus: "approved",
          certificates: { lyft: "https://rideshareinspection.b-cdn.net/cert-lyft" },
        })}
        role="customer"
      />,
    );

    // Certificate buttons now show company key + download icon, not links
    const buttons = screen.getAllByRole("button", { name: /lyft/i });
    expect(buttons.length).toBeGreaterThan(0);
    
    // The certificate URL is used for download, not displayed as a link
  });

  it("shows Pay action for unpaid customer", async () => {
    const user = userEvent.setup();
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    const pay = screen.getByRole("button", { name: /pay/i });
    expect(pay).toBeEnabled();
    await user.click(pay);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/customer/pay/1");
  });

  it("hides Pay action when payment succeeded", () => {
    render(
      <InspectionDetailView
        inspection={detail({ paymentStatus: "succeeded" })}
        role="customer"
      />,
    );

    expect(screen.queryByRole("button", { name: /pay/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Payment received\. Certificates will be available once approved/i),
    ).toBeInTheDocument();
  });

  it("hides Pay action when inspection status is paid even if payment status is pending", () => {
    render(
      <InspectionDetailView
        inspection={detail({ paymentStatus: "pending", inspectionStatus: "paid" })}
        role="customer"
      />,
    );

    expect(screen.queryByRole("button", { name: /pay/i })).not.toBeInTheDocument();
  });

  it("renders admin action bar for admin role", () => {
    render(<InspectionDetailView inspection={detail()} role="admin" />);

    const approve = screen.getByRole("button", { name: /approve/i });
    const reject = screen.getByRole("button", { name: /reject/i });
    expect(approve).toBeDisabled();
    expect(reject).toBeEnabled();
    expect(screen.queryByRole("button", { name: /pay/i })).not.toBeInTheDocument();
  });
});