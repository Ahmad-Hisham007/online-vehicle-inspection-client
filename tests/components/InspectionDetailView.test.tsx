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
    media: {
      general: [
        { label: "Odometer", url: "https://ucarecdn.com/odo", type: "image" },
        { label: "Horn", url: "https://ucarecdn.com/horn", type: "video" },
      ],
      interior: [],
      exterior: [],
      tires: [
        {
          label: "Left Front Tire",
          url: "https://ucarecdn.com/tire-lf",
          type: "image",
        },
      ],
    },
    certificates: {},
    orderSubtotal: "63",
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("InspectionDetailView", () => {
  it("renders header, title and creation date", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(screen.getByText("Car details")).toBeInTheDocument();
    expect(screen.getByText("Inspection #1")).toBeInTheDocument();
    expect(screen.getByText(/08\/15\/26/)).toBeInTheDocument();
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

    expect(screen.getByText("2027-08-15")).toBeInTheDocument();
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

  it("shows certificates placeholder when not approved", () => {
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    expect(
      screen.getByText(
        "Certificates will be available once the inspection is approved.",
      ),
    ).toBeInTheDocument();
  });

  it("shows certificate links when approved", () => {
    render(
      <InspectionDetailView
        inspection={detail({
          inspectionStatus: "approved",
          certificates: { lyft: "https://ucarecdn.com/cert-lyft" },
        })}
        role="customer"
      />,
    );

    const link = screen.getByRole("link", {
      name: /Download Lyft certificate/i,
    });
    expect(link).toHaveAttribute("href", "https://ucarecdn.com/cert-lyft");
  });

  it("shows Pay action for unpaid customer", async () => {
    const user = userEvent.setup();
    render(<InspectionDetailView inspection={detail()} role="customer" />);

    const pay = screen.getByRole("button", { name: /pay/i });
    expect(pay).toBeEnabled();
    await user.click(pay);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/customer/pay/1");
  });

  it("hides Pay action for paid customer", () => {
    render(
      <InspectionDetailView
        inspection={detail({ paymentStatus: "succeeded" })}
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
    expect(reject).toBeDisabled();
    expect(screen.getByText(/Admin actions/i)).toBeInTheDocument();
  });
});