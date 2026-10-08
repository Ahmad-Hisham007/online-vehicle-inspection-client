import { describe, it, expect } from "vitest";
import { buildCertificateData, computeExpiryIso } from "@/app/lib/pdf/data";
import type { InspectionDetail } from "@/app/lib/types";

function detail(overrides: Partial<InspectionDetail> = {}): InspectionDetail {
  return {
    id: "234",
    licensePlate: "ABC123",
    dateCreated: "2026-08-15T17:14:00",
    inspectionStatus: "paid",
    paymentStatus: "succeeded",
    vin: "1HGCM82633A004352",
    make: "Honda",
    model: "Accord",
    year: "2020",
    fuelType: "gasoline",
    mileage: "50000",
    color: "Silver",
    location: { country: "USA", state: "CA" },
    companies: ["uber", "lyft"],
    inspectionDate: "2026-08-15",
    expiryDate: "",
    hostName: "Host Person",
    hostEmail: "host@example.com",
    hostPhoneNumber: "555-0100",
    driverName: "John Doe",
    driverEmail: "john@example.com",
    media: { general: [], interior: [], exterior: [], tires: [] },
    certificates: {},
    orderSubtotal: "63",
    approvalFields: {},
    ...overrides,
  };
}

describe("buildCertificateData — defaults", () => {
  it("applies safe defaults to empty pass/fail and yes/no fields", () => {
    const data = buildCertificateData(detail(), "uber");

    expect(data.registration.hasSticker).toBe("pass");
    expect(data.brakes.frontLeft).toBe("pass");
    expect(data.brakes.frontRight).toBe("pass");
    expect(data.brakes.rearLeft).toBe("pass");
    expect(data.brakes.rearRight).toBe("pass");
    expect(data.condition.tiresOlderThan6Years).toBe("no");
    expect(data.condition.batteryOlderThan5Years).toBe("no");
    expect(data.condition.voltageGreaterThan12_1V).toBe("yes");
  });

  it("honours explicit fail/no values over the defaults", () => {
    const data = buildCertificateData(
      detail({
        approvalFields: {
          frontBrakeLeft: "fail",
          hasRegistrationSticker: "FAIL",
          tiresOlderThan6Years: "yes",
          voltageGreaterThan12_1V: "no",
        },
      }),
      "uber",
    );

    expect(data.brakes.frontLeft).toBe("fail");
    expect(data.registration.hasSticker).toBe("fail");
    expect(data.condition.tiresOlderThan6Years).toBe("yes");
    expect(data.condition.voltageGreaterThan12_1V).toBe("no");
  });

  it("reads the typo-preserved ACF keys exactly", () => {
    const data = buildCertificateData(
      detail({
        approvalFields: {
          tncLicensePlatesLast4Digit: "BC12",
          registrationStickerMonthyear: "08/2026",
          voltageGreaterThan12_1V: "yes",
        },
      }),
      "lyft",
    );

    expect(data.registration.tncLast4).toBe("BC12");
    expect(data.registration.stickerMonthYear).toBe("08/2026");
    expect(data.condition.voltageGreaterThan12_1V).toBe("yes");
  });

  it("falls back to the top-level detail fields when approvalFields are empty", () => {
    const data = buildCertificateData(detail(), "uber");

    expect(data.vehicle.make).toBe("Honda");
    expect(data.vehicle.vin).toBe("1HGCM82633A004352");
    expect(data.vehicle.fuelType).toBe("gasoline");
    expect(data.registration.licensePlate).toBe("ABC123");
    expect(data.host.name).toBe("Host Person");
  });
});

describe("buildCertificateData — overrides", () => {
  it("lets whitelisted overrides win over stored values", () => {
    const data = buildCertificateData(
      detail({ approvalFields: { vehicleMake: "Honda" } }),
      "uber",
      { vehicleMake: "Toyota" },
    );

    expect(data.vehicle.make).toBe("Toyota");
  });

  it("drops unknown override keys", () => {
    const data = buildCertificateData(detail(), "uber", {
      notAField: "SENTINEL",
    });

    expect(JSON.stringify(data)).not.toContain("SENTINEL");
  });

  it("applies the reserved ARD/facility overrides", () => {
    const data = buildCertificateData(detail(), "uber", {
      arn: "ARD-9999",
      facilityName: "Override Facility",
      facilityAddress: "9 Override Way",
    });

    expect(data.arn).toBe("ARD-9999");
    expect(data.facility.name).toBe("Override Facility");
    expect(data.facility.address).toBe("9 Override Way");
  });
});

describe("buildCertificateData — dates", () => {
  it("formats the inspection date MM/DD/YYYY and expiry +12 months", () => {
    const data = buildCertificateData(
      detail({ inspectionDate: "2026-08-15" }),
      "uber",
    );

    expect(data.inspection.date).toBe("08/15/2026");
    expect(data.inspection.expiryDate).toBe("08/15/2027");
  });

  it("clamps month overflow (Jan 31 → Jan 31 next year, Feb 29 → Feb 28)", () => {
    expect(
      buildCertificateData(detail({ inspectionDate: "2028-01-31" }), "uber")
        .inspection.expiryDate,
    ).toBe("01/31/2029");
    expect(
      buildCertificateData(detail({ inspectionDate: "2028-02-29" }), "uber")
        .inspection.expiryDate,
    ).toBe("02/28/2029");
  });

  it("prefers the approvalFields inspectionDate over the detail one", () => {
    const data = buildCertificateData(
      detail({ inspectionDate: "2026-08-15" }),
      "uber",
      { inspectionDate: "2025-01-05" },
    );

    expect(data.inspection.date).toBe("01/05/2025");
    expect(data.inspection.expiryDate).toBe("01/05/2026");
  });

  it("yields empty dates for an unparseable/missing inspection date", () => {
    const data = buildCertificateData(detail({ inspectionDate: "" }), "uber");

    expect(data.inspection.date).toBe("");
    expect(data.inspection.expiryDate).toBe("");
  });
});

describe("computeExpiryIso", () => {
  it("returns the ISO YYYY-MM-DD expiry", () => {
    expect(computeExpiryIso("2026-08-15")).toBe("2027-08-15");
    expect(computeExpiryIso("2028-02-29")).toBe("2029-02-28");
  });

  it("returns empty for an unparseable date", () => {
    expect(computeExpiryIso("")).toBe("");
    expect(computeExpiryIso("not-a-date")).toBe("");
  });
});

describe("buildCertificateData — misc", () => {
  it("groups mileage thousands and passes non-numerics through", () => {
    expect(
      buildCertificateData(detail({ mileage: "50000" }), "uber").vehicle
        .mileage,
    ).toBe("50,000");
    expect(
      buildCertificateData(detail(), "uber", { vehicleMileage: "1234567" })
        .vehicle.mileage,
    ).toBe("1,234,567");
    expect(
      buildCertificateData(detail(), "uber", { vehicleMileage: "low" }).vehicle
        .mileage,
    ).toBe("low");
  });

  it("joins company labels, falling back to raw values", () => {
    const data = buildCertificateData(
      detail({ companies: ["uber", "lyft", "getaround"] }),
      "uber",
    );

    expect(data.inspection.companiesLabel).toBe("Uber, Lyft, getaround");
  });

  it("honours a live inspectionCompanies override", () => {
    const data = buildCertificateData(detail(), "uber", {
      inspectionCompanies: "Uber only",
    });

    expect(data.inspection.companiesLabel).toBe("Uber only");
  });

  it("normalizes the CANADA location to the CertCountry union", () => {
    const data = buildCertificateData(
      detail({ location: { country: "CANADA", state: "ON" } }),
      "uber",
    );

    expect(data.country).toBe("Canada");
    expect(data.state).toBe("ON");
  });

  it("carries driver identity from the detail (host IS driver)", () => {
    const data = buildCertificateData(detail(), "uber");

    expect(data.driver).toEqual({
      name: "Host Person",
      email: "host@example.com",
      phone: "555-0100",
    });
    expect(data.host).toEqual({
      name: "Host Person",
      email: "host@example.com",
      phone: "555-0100",
    });
  });

  it("uses per-company ARD constants and empty values for unknown companies", () => {
    expect(buildCertificateData(detail(), "uber").arn).toBe("ARD-00000001");
    expect(buildCertificateData(detail(), "lyft").arn).toBe("ARD-00000002");
    expect(buildCertificateData(detail(), "turo").arn).toBe("ARD-00000003");
    expect(buildCertificateData(detail(), "bolt").arn).toBe("");
  });
});
