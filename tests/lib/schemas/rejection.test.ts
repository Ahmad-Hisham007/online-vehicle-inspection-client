import { describe, it, expect } from "vitest";

import { rejectionSchema } from "@/app/lib/schemas/rejection";

describe("rejectionSchema", () => {
  it("accepts a valid payload", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: ["licensePlate", "vin"],
      rejectionReason: "Vehicle does not match the VIN on the registration.",
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one invalid field", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: [],
      rejectionReason: "Something is wrong",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Select at least one invalid field",
      );
    }
  });

  it("rejects unknown field values", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: ["notAField"],
      rejectionReason: "Reason",
    });
    expect(result.success).toBe(false);
  });

  it("requires a non-empty reason", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: ["horn"],
      rejectionReason: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Rejection reason is required",
      );
    }
  });

  it("trims the reason", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: ["horn"],
      rejectionReason: "  Fix the horn  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rejectionReason).toBe("Fix the horn");
    }
  });

  it("caps the reason at 2000 characters", () => {
    const result = rejectionSchema.safeParse({
      invalidFields: ["horn"],
      rejectionReason: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Reason is too long");
    }
  });
});
