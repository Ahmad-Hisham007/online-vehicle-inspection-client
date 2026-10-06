import { describe, it, expect } from "vitest";
import {
  getStatusStyle,
  getStatusLabel,
  getPaymentStatusLabel,
  getStatusPillStyle,
  canApproveInspection,
  canRejectInspection,
} from "@/app/lib/status";
import { INSPECTION_STATUSES, PAYMENT_STATUSES } from "@/app/lib/types";

describe("getStatusStyle", () => {
  it("maps every inspection status to a style", () => {
    const expected: Record<string, string> = {
      pending: "bg-sky-400",
      paid: "bg-emerald-500",
      payment_failed: "bg-red-500",
      in_progress: "bg-yellow-400",
      approved: "bg-emerald-500",
      rejected: "bg-red-500",
      cancelled: "bg-gray-400",
    };

    for (const status of INSPECTION_STATUSES) {
      const style = getStatusStyle(status);
      expect(style.label).toBeTruthy();
      expect(style.dot).toBe(expected[status]);
      expect(style.text).toBeTruthy();
    }
  });

  it("returns capitalized standard labels", () => {
    expect(getStatusLabel("pending")).toBe("Pending");
    expect(getStatusLabel("payment_failed")).toBe("Payment Failed");
    expect(getStatusLabel("in_progress")).toBe("In Progress");
    expect(getStatusLabel("approved")).toBe("Approved");
  });
});

describe("getPaymentStatusLabel", () => {
  it("maps every payment status to a label", () => {
    for (const status of PAYMENT_STATUSES) {
      expect(getPaymentStatusLabel(status)).toBeTruthy();
    }
  });

  it("returns standard labels", () => {
    expect(getPaymentStatusLabel("succeeded")).toBe("Succeeded");
    expect(getPaymentStatusLabel("requires_action")).toBe("Requires Action");
  });
});

describe("getStatusPillStyle", () => {
  it("returns a pill class for every inspection status", () => {
    const expected: Record<string, string> = {
      pending: "bg-sky-50",
      paid: "bg-emerald-50",
      payment_failed: "bg-red-50",
      in_progress: "bg-yellow-50",
      approved: "bg-emerald-50",
      rejected: "bg-red-50",
      cancelled: "bg-gray-50",
    };

    for (const status of INSPECTION_STATUSES) {
      const pill = getStatusPillStyle(status);
      expect(pill.className).toContain(expected[status]);
      expect(pill.className).toContain("border-");
      expect(pill.label).toBeTruthy();
    }
  });
});

describe("canApproveInspection / canRejectInspection", () => {
  const APPROVABLE: Record<string, boolean> = {
    pending: false,
    paid: true,
    payment_failed: false,
    in_progress: true,
    approved: false,
    rejected: false,
    cancelled: false,
  };

  const REJECTABLE: Record<string, boolean> = {
    pending: true,
    paid: true,
    payment_failed: true,
    in_progress: false,
    approved: false,
    rejected: true,
    cancelled: true,
  };

  it("covers every inspection status", () => {
    for (const status of INSPECTION_STATUSES) {
      expect(canApproveInspection(status)).toBe(APPROVABLE[status]);
      expect(canRejectInspection(status)).toBe(REJECTABLE[status]);
    }
  });

  it("allows approve only for paid and in_progress", () => {
    expect(canApproveInspection("paid")).toBe(true);
    expect(canApproveInspection("in_progress")).toBe(true);
    expect(canApproveInspection("approved")).toBe(false);
    expect(canApproveInspection("pending")).toBe(false);
  });

  it("allows reject for everything except in_progress/approved", () => {
    expect(canRejectInspection("pending")).toBe(true);
    expect(canRejectInspection("payment_failed")).toBe(true);
    expect(canRejectInspection("rejected")).toBe(true);
    expect(canRejectInspection("cancelled")).toBe(true);
    expect(canRejectInspection("paid")).toBe(true);
    expect(canRejectInspection("in_progress")).toBe(false);
    expect(canRejectInspection("approved")).toBe(false);
  });
});