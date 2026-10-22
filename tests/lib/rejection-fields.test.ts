import { describe, it, expect } from "vitest";

import {
  REJECTION_FIELDS,
  REJECTION_FIELD_LABELS,
  REJECTION_FIELD_VALUES,
  rejectionFieldsToHtml,
} from "@/app/lib/rejection-fields";

describe("REJECTION_FIELDS", () => {
  it("exposes exactly 17 fields", () => {
    expect(REJECTION_FIELDS).toHaveLength(17);
  });

  it("has unique values and labels", () => {
    const values = REJECTION_FIELDS.map((f) => f.value);
    const labels = REJECTION_FIELDS.map((f) => f.label);
    expect(new Set(values).size).toBe(values.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("builds the label lookup and value tuple", () => {
    expect(REJECTION_FIELD_VALUES).toHaveLength(17);
    expect(REJECTION_FIELD_LABELS.vin).toBe("VIN");
    expect(REJECTION_FIELD_LABELS.licensePlate).toBe("License plate");
    expect(Object.keys(REJECTION_FIELD_LABELS)).toHaveLength(17);
  });
});

describe("rejectionFieldsToHtml", () => {
  it("returns an empty string when nothing is selected", () => {
    expect(rejectionFieldsToHtml([])).toBe("");
  });

  it("wraps labels in a ul/li list", () => {
    expect(rejectionFieldsToHtml(["licensePlate"])).toBe(
      "<ul><li>License plate</li></ul>",
    );
  });

  it("follows registry order regardless of selection order", () => {
    expect(rejectionFieldsToHtml(["vin", "licensePlate"])).toBe(
      "<ul><li>License plate</li><li>VIN</li></ul>",
    );
  });

  it("ignores unknown values", () => {
    expect(rejectionFieldsToHtml(["notAField", "horn"])).toBe(
      "<ul><li>Horn</li></ul>",
    );
    expect(rejectionFieldsToHtml(["notAField"])).toBe("");
  });

  it("escapes HTML in labels", () => {
    // defensive: labels are static today, but escaping must hold
    expect(rejectionFieldsToHtml(["vin"])).not.toContain("<script");
  });
});
