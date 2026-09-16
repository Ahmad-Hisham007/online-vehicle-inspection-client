import { describe, it, expect } from "vitest";
import {
  APPROVAL_GROUPS,
  APPROVAL_CERTIFICATE_COMPANIES,
  APPROVAL_COMPANY_LABELS,
  YES_NO_OPTIONS,
  PASS_FAIL_OPTIONS,
  getVisibleFields,
  type ApprovalFieldType,
} from "@/app/lib/approval-fields";

const ALL_FIELDS = APPROVAL_GROUPS.flatMap((g) => g.fields);
const fieldByName = (name: string) =>
  ALL_FIELDS.find((f) => f.name === name);

describe("APPROVAL_GROUPS", () => {
  it("has the expected group order", () => {
    expect(APPROVAL_GROUPS.map((g) => g.id)).toEqual([
      "vehicle",
      "registration",
      "condition",
      "brakes",
      "tires",
      "inspection",
      "handler",
      "host",
    ]);
  });

  it("has a label and at least one field per group", () => {
    for (const group of APPROVAL_GROUPS) {
      expect(group.label).toBeTruthy();
      expect(group.fields.length).toBeGreaterThan(0);
    }
  });

  it("uses unique field names", () => {
    const names = ALL_FIELDS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("excludes status, subtotal, agreements, expiry and media fields", () => {
    const excluded = [
      "inspectionStatus",
      "paymentStatus",
      "orderSubtotal",
      "inspectionDay",
      "inspectionMonth",
      "inspectionYear",
      "expiryDate",
      "userAgreement",
      "inspectionAgreement",
      "registrationCardPhoto",
      "odometerPhoto",
    ];
    for (const name of excluded) {
      expect(fieldByName(name)).toBeUndefined();
    }
  });

  it("types the pass/fail fields precisely", () => {
    const passFail = ALL_FIELDS.filter((f) => f.type === "passfail").map(
      (f) => f.name,
    );
    expect(passFail.sort()).toEqual(
      [
        "frontBrakeLeft",
        "frontBrakeRight",
        "hasRegistrationSticker",
        "rearBrakeLeft",
        "rearBrakeRight",
      ].sort(),
    );
  });

  it("types the yes/no fields precisely", () => {
    const yesNo = ALL_FIELDS.filter((f) => f.type === "yesno").map((f) => f.name);
    expect(yesNo.sort()).toEqual(
      [
        "batteryOlderThan5Years",
        "tiresOlderThan6Years",
        "voltageGreaterThan12_1V",
      ].sort(),
    );
  });

  it("types numeric, date and contact fields precisely", () => {
    const numberFields = ALL_FIELDS.filter((f) => f.type === "number").map(
      (f) => f.name,
    );
    expect(numberFields).toContain("vehicleYear");
    expect(numberFields).toContain("vehicleMileage");
    expect(numberFields).toContain("numberOfDoors");
    expect(numberFields).toContain("numberOfSeatbelts");
    expect(numberFields).toContain("tireRightFrontDepth");
    expect(numberFields).toContain("minPerManufacturerFront");

    expect(fieldByName("inspectionDate")?.type).toBe("date");
    expect(fieldByName("hostEmail")?.type).toBe("email");
    expect(fieldByName("hostPhoneNumber")?.type).toBe("tel");
    expect(fieldByName("inspectionCompanies")?.type).toBe("readonly");
  });

  it("gives every select field options", () => {
    for (const field of ALL_FIELDS) {
      if (field.type === "select") {
        expect(field.options?.length).toBeGreaterThan(0);
      }
    }
  });

  it("defines the shared option sets", () => {
    expect(YES_NO_OPTIONS.map((o) => o.value)).toEqual(["yes", "no"]);
    expect(PASS_FAIL_OPTIONS.map((o) => o.value)).toEqual(["pass", "fail"]);
  });
});

describe("certificate companies", () => {
  it("only targets companies with a WP certificate field", () => {
    expect(APPROVAL_CERTIFICATE_COMPANIES.sort()).toEqual([
      "lyft",
      "turo",
      "uber",
    ]);
    expect(APPROVAL_COMPANY_LABELS.lyft).toBe("Lyft");
  });
});

describe("getVisibleFields", () => {
  it("hides the USA state field for Canada and the province field for USA", () => {
    const usa = getVisibleFields({ country: "USA", company: "uber" }).map(
      (f) => f.name,
    );
    expect(usa).toContain("inspectionStateUsa");
    expect(usa).not.toContain("inspectionStateCanada");

    const canada = getVisibleFields({ country: "Canada", company: "turo" }).map(
      (f) => f.name,
    );
    expect(canada).toContain("inspectionStateCanada");
    expect(canada).not.toContain("inspectionStateUsa");
  });

  it("shows every unconditional field regardless of company", () => {
    const fields = getVisibleFields({ country: "USA", company: "lyft" }).map(
      (f) => f.name,
    );
    expect(fields).toContain("vehicleMake");
    expect(fields).toContain("frontBrakeLeft");
    expect(fields).toContain("hostEmail");
  });

  it("returns only the documented field types", () => {
    const allowed: ApprovalFieldType[] = [
      "text",
      "number",
      "date",
      "email",
      "tel",
      "select",
      "yesno",
      "passfail",
      "readonly",
    ];
    for (const field of getVisibleFields({ country: "USA", company: "uber" })) {
      expect(allowed).toContain(field.type);
    }
  });
});