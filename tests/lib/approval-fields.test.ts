import { describe, it, expect } from "vitest";
import {
  APPROVAL_GROUPS,
  APPROVAL_CERTIFICATE_COMPANIES,
  APPROVAL_COMPANY_LABELS,
  YES_NO_OPTIONS,
  PASS_FAIL_OPTIONS,
  getVisibleFields,
  type ApprovalFieldDef,
  type ApprovalFieldType,
} from "@/app/lib/approval-fields";

/** Function form of `ApprovalFieldDef.defaultValue`. */
type DefaultValueFn = Exclude<
  NonNullable<ApprovalFieldDef["defaultValue"]>,
  string
>;

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
      "facility",
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
    expect(numberFields).not.toContain("tireRightFrontDepth"); // Changed to text in Phase 6.3

    // Tire depths are text type with "6/32" default
    expect(fieldByName("tireRightFrontDepth")?.type).toBe("text");

    expect(fieldByName("inspectionDate")?.type).toBe("date");
    expect(fieldByName("hostEmail")?.type).toBe("email");
    expect(fieldByName("hostPhoneNumber")?.type).toBe("tel");
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

describe("field default values", () => {
  it("defines defaultValue for facility fields", () => {
    expect(fieldByName("facilityName")?.defaultValue).toBe("INSVE");
    expect(fieldByName("facilityAddress")?.defaultValue).toBe(
      "417 J St, Sacramento, CA 95816",
    );
    expect(fieldByName("facilityStreetAddress")?.defaultValue).toBe("417 J St");
    expect(fieldByName("facilityLocationName")?.defaultValue).toBe("Sacramento");
    expect(fieldByName("facilityState")?.defaultValue).toBe("California");
  });

  it("defines defaultValue for tire fields", () => {
    const tireFields = [
      "tireRightFrontDepth",
      "tireLeftFrontDepth",
      "tireRightRearDepth",
      "tireLeftRearDepth",
    ];
    for (const name of tireFields) {
      expect(fieldByName(name)?.defaultValue).toBe("6/32");
    }
  });

  it("defines defaultValue function for handler fields", () => {
    const handlerNameField = fieldByName("handlerName");
    expect(handlerNameField?.defaultValue).toBeInstanceOf(Function);

    // Test with session
    const ctxWithSession = {
      country: "USA" as const,
      company: "uber",
      session: { name: "John Doe" },
    };
    expect(
      (handlerNameField?.defaultValue as DefaultValueFn)(ctxWithSession),
    ).toBe("John Doe");

    // Test without session
    const ctxWithoutSession = {
      country: "USA" as const,
      company: "uber",
    };
    expect(
      (handlerNameField?.defaultValue as DefaultValueFn)(ctxWithoutSession),
    ).toBe("");
  });

  it("handler fields use session when available", () => {
    const handlerNameField = fieldByName("handlerName");
    const handlerSignatureField = fieldByName("handlerSignature");

    const ctx = {
      country: "USA" as const,
      company: "lyft",
      session: { name: "Jane Smith" },
    };

    expect(
      (handlerNameField?.defaultValue as DefaultValueFn)(ctx),
    ).toBe("Jane Smith");
    expect(
      (handlerSignatureField?.defaultValue as DefaultValueFn)(ctx),
    ).toBe("Jane Smith");
  });

  it("falls back to placeholder for fields without defaultValue", () => {
    expect(fieldByName("vehicleMake")?.defaultValue).toBeUndefined();
    expect(fieldByName("vehicleModel")?.defaultValue).toBeUndefined();
  });
});

describe("defaultValue precedence", () => {
  /**
   * Helper function to simulate getDefaultValue logic from ApprovalCompanyForm
   */
  const getDefaultValue = (
    field: ApprovalFieldDef,
    initialValues: Record<string, string>,
    ctx: { country: string; company: string; session?: { name?: string } },
  ): string => {
    // First, check if initialValues has a value (highest priority)
    if (initialValues[field.name]) {
      return initialValues[field.name];
    }

    // Second, use field's defaultValue if defined
    if (field.defaultValue !== undefined) {
      return typeof field.defaultValue === "function"
        ? (field.defaultValue as DefaultValueFn)(ctx)
        : field.defaultValue;
    }

    // Third, fall back to placeholder
    return field.placeholder || "";
  };

  it("initialValues take precedence over defaultValue", () => {
    const field = fieldByName("facilityName")!;
    const initialValues = { facilityName: "Custom Facility" };
    const ctx = { country: "USA", company: "uber" };

    const result = getDefaultValue(field, initialValues, ctx);
    expect(result).toBe("Custom Facility");
  });

  it("uses defaultValue when initialValues doesn't have it", () => {
    const field = fieldByName("facilityName")!;
    const initialValues: Record<string, string> = {};
    const ctx = { country: "USA", company: "uber" };

    const result = getDefaultValue(field, initialValues, ctx);
    expect(result).toBe("INSVE");
  });

  it("uses placeholder when neither initialValues nor defaultValue exist", () => {
    const field = fieldByName("vehicleMake")!;
    const initialValues: Record<string, string> = {};
    const ctx = { country: "USA", company: "uber" };

    const result = getDefaultValue(field, initialValues, ctx);
    expect(result).toBe("E.g. Toyota");
  });
});