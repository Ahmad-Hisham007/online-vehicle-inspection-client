import {
  APPROVAL_COMPANY_LABELS,
  getVisibleFields,
} from "@/app/lib/approval-fields";
import { getCertificateConstants } from "@/app/lib/pdf/certificate-constants";
import type {
  CertificateData,
  CertCountry,
  PassFail,
  YesNo,
} from "@/app/lib/pdf/types";
import type { InspectionDetail } from "@/app/lib/types";

/**
 * Override keys that are NOT ACF approval fields (spec §3.6) — the inspector
 * may still override ARD/facility identity for a render.
 */
const RESERVED_OVERRIDE_KEYS = new Set([
  "arn",
  "facilityName",
  "facilityAddress",
]);

/** Parse `YYYY-MM-DD` (or any Date-constructible string) as a UTC date. */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

/** Add months with end-of-month clamping (Jan 31 → Feb 28/29). */
function addMonths(d: Date, months: number): Date {
  const day = d.getUTCDate();
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Group digit runs with thousands separators; pass through non-numerics. */
function groupThousands(value: string): string {
  const digits = value.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(digits)) return value;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * ISO (`YYYY-MM-DD`) expiry = inspection date + 12 months (spec §4.2).
 * Returns "" for an unparseable/empty date. Used by `approveInspection` (T8)
 * so WP and the PDF never diverge on the +12-months rule.
 */
export function computeExpiryIso(inspectionDate: string): string {
  const parsed = parseIsoDate(inspectionDate);
  if (!parsed) return "";
  return addMonths(parsed, 12).toISOString().slice(0, 10);
}

/**
 * Assemble the typed certificate payload (spec §4.2), merging in order:
 * 1. `detail.approvalFields` (stored ACF values),
 * 2. whitelisted `overrides` (keys ∈ visible field names + reserved keys),
 * 3. derived defaults (safe pass/fail + yes/no values, dates, mileage, labels).
 *
 * Unknown override keys are dropped — never rendered, never written to WP.
 */
export function buildCertificateData(
  detail: InspectionDetail,
  company: string,
  overrides: Record<string, string> = {},
): CertificateData {
  const country: CertCountry =
    detail.location.country.toUpperCase() === "CANADA" ? "Canada" : "USA";

  const allowed = new Set(
    getVisibleFields({ country, company }).map((field) => field.name),
  );
  const values: Record<string, string> = { ...detail.approvalFields };
  for (const [key, value] of Object.entries(overrides)) {
    if (allowed.has(key) || RESERVED_OVERRIDE_KEYS.has(key)) {
      values[key] = value;
    }
  }

  const v = (key: string): string => values[key] ?? "";
  const passFail = (key: string): PassFail =>
    v(key).trim().toLowerCase() === "fail" ? "fail" : "pass";
  const yesNo = (key: string, fallback: YesNo): YesNo => {
    const raw = v(key).trim().toLowerCase();
    return raw === "yes" || raw === "no" ? raw : fallback;
  };

  const inspectionSource = v("inspectionDate") || detail.inspectionDate;
  const inspectionDate = parseIsoDate(inspectionSource);
  const expiry = inspectionDate ? addMonths(inspectionDate, 12) : null;

  const constants = getCertificateConstants(company);

  return {
    company,
    country,
    state: detail.location.state,
    driver: { 
      name: detail.driverName, 
      email: detail.driverEmail,
      phone: v("driverPhoneNumber") || detail.driverPhoneNumber || undefined,
    },
    host: {
      name: v("hostName") || detail.hostName,
      email: v("hostEmail") || detail.hostEmail,
      phone: v("hostPhoneNumber") || detail.hostPhoneNumber,
    },
    vehicle: {
      make: v("vehicleMake") || detail.make,
      model: v("vehicleModel") || detail.model,
      year: v("vehicleYear") || detail.year,
      color: v("vehicleColor") || detail.color,
      mileage: groupThousands(v("vehicleMileage") || detail.mileage),
      vin: v("vin") || detail.vin,
      doors: v("numberOfDoors"),
      seatbelts: v("numberOfSeatbelts"),
      fuelType: v("fuelType") || detail.fuelType,
    },
    registration: {
      licensePlate: v("licensePlateNumber") || detail.licensePlate,
      tncLast4: v("tncLicesnePlatesLast4Digit"),
      hasSticker: passFail("hasRegistrationSticker"),
      stickerMonthYear: v("registrationStickerMonthyear"),
      zip: v("zip"),
    },
    condition: {
      tiresOlderThan6Years: yesNo("tiresOlderThan6Years", "no"),
      batteryOlderThan5Years: yesNo("batteryOlderThan5Years", "no"),
      voltageGreaterThan12_1V: yesNo("voltageGreaterThan12_1V", "yes"),
    },
    brakes: {
      minFront: v("minPerManufacturerFront"),
      minRear: v("minPerManufacturerRear"),
      frontLeft: passFail("frontBrakeLeft"),
      frontRight: passFail("frontBrakeRight"),
      rearLeft: passFail("rearBrakeLeft"),
      rearRight: passFail("rearBrakeRight"),
    },
    tires: {
      rightFront: v("tireRightFrontDepth"),
      leftFront: v("tireLeftFrontDepth"),
      rightRear: v("tireRightRearDepth"),
      leftRear: v("tireLeftRearDepth"),
    },
    inspection: {
      date: inspectionDate ? formatDate(inspectionDate) : inspectionSource,
      expiryDate: expiry ? formatDate(expiry) : "",
      companiesLabel:
        overrides.inspectionCompanies ??
        detail.companies
          .map((c) => APPROVAL_COMPANY_LABELS[c] ?? c)
          .join(", "),
    },
    handler: {
      name: v("handlerName"),
      signature: v("handlerSignature"),
    },
    arn: overrides.arn ?? constants.arn,
    facility: {
      name: overrides.facilityName ?? constants.facility.name,
      address: overrides.facilityAddress ?? constants.facility.address,
    },
  };
}