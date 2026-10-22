import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import RejectionInfoBlock from "@/app/components/InspectionDetailView/RejectionInfoBlock";
import type { InspectionDetail } from "@/app/lib/types";

function renderBlock(inspection: Partial<InspectionDetail> = {}) {
  const defaults: Partial<InspectionDetail> = {
    id: "123",
    inspectionStatus: "pending",
    invalidFields: undefined,
    rejectionReason: undefined,
  };
  return render(<RejectionInfoBlock inspection={{ ...defaults, ...inspection }} />);
}

describe("RejectionInfoBlock", () => {
  it("renders nothing when inspection is not rejected", () => {
    renderBlock({ inspectionStatus: "approved" });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders nothing when no rejection data", () => {
    renderBlock({ inspectionStatus: "rejected" });
    expect(screen.queryByRole("region", { name: /rejection details/i })).not.toBeInTheDocument();
  });

  it("renders the invalid fields as HTML list", () => {
    renderBlock({
      inspectionStatus: "rejected",
      invalidFields: "<ul><li>License plate</li><li>VIN</li></ul>",
    });

    expect(
      screen.getByRole("region", { name: /rejection details/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("License plate")).toBeInTheDocument();
    expect(screen.getByText("VIN")).toBeInTheDocument();
  });

  it("renders the rejection reason as plain text", () => {
    renderBlock({
      inspectionStatus: "rejected",
      rejectionReason: "  Fix the horn and clean the dash.  ",
    });

    expect(screen.getByText("Reasons for rejection")).toBeInTheDocument();
    expect(screen.getByText("Fix the horn and clean the dash.")).toBeInTheDocument();
  });

  it("renders both fields and reason together", () => {
    renderBlock({
      inspectionStatus: "rejected",
      invalidFields: "<ul><li>Horn</li></ul>",
      rejectionReason: "Replace the horn",
    });

    expect(screen.getByText("Reasons for rejection")).toBeInTheDocument();
    expect(screen.getByText("Horn")).toBeInTheDocument();
    expect(screen.getByText("Replace the horn")).toBeInTheDocument();
  });

  it("strips unknown HTML tags from invalid fields", () => {
    renderBlock({
      inspectionStatus: "rejected",
      // Simulate a malicious or malformed edit
      invalidFields: "<ul><li onclick=\"alert(1)\">License plate</li><script>alert('xss')</script></ul>",
    });

    const region = screen.getByRole("region", { name: /rejection details/i });
    expect(region).toBeInTheDocument();
    // Script should be stripped
    expect(region).not.toHaveTextContent("<script>");
    // Callback-style handlers should be stripped
    expect(region).not.toHaveTextContent("onclick");
  });
});