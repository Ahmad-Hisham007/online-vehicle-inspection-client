import type { PDFFont, PDFPage } from "pdf-lib";

/**
 * Colour accepted by pdf-lib draw operators (the `RGB` produced by `rgb()`).
 * Derived structurally so we never depend on pdf-lib's internal type names.
 */
export type CertificateInk = NonNullable<
  NonNullable<Parameters<PDFPage["drawText"]>[1]>["color"]
>;

export type CertCountry = "USA" | "Canada";
export type PassFail = "pass" | "fail";
export type YesNo = "yes" | "no";

/**
 * Fully-typed, flattened certificate payload (spec §4.1).
 * All leaves are strings — formatting happens in `data.ts` or placement
 * `format` hooks, never in the type.
 */
export interface CertificateData {
  company: string;
  country: CertCountry;
  state: string;
  driver: { name: string; email: string };
  host: { name: string; email: string; phone: string };
  vehicle: {
    make: string;
    model: string;
    year: string;
    color: string;
    mileage: string;
    vin: string;
    doors: string;
    seatbelts: string;
    fuelType: string;
  };
  registration: {
    licensePlate: string;
    tncLast4: string;
    hasSticker: PassFail;
    stickerMonthYear: string;
    zip: string;
  };
  condition: {
    tiresOlderThan6Years: YesNo;
    batteryOlderThan5Years: YesNo;
    voltageGreaterThan12_1V: YesNo;
  };
  brakes: {
    minFront: string;
    minRear: string;
    frontLeft: PassFail;
    frontRight: PassFail;
    rearLeft: PassFail;
    rearRight: PassFail;
  };
  tires: {
    rightFront: string;
    leftFront: string;
    rightRear: string;
    leftRear: string;
  };
  inspection: { date: string; expiryDate: string; companiesLabel: string };
  handler: { name: string; signature: string };
  arn: string;
  facility: { name: string; address: string };
}

/** Everything a draw helper needs: target page, embedded font, ink, RNG. */
export interface DrawContext {
  page: PDFPage;
  font: PDFFont;
  ink: CertificateInk;
  rand: () => number;
}

export type PlacementKind = "text" | "checkmark" | "passCircle" | "signature";

/** One field position on a blank template (spec §5.2). */
export interface Placement {
  /** Default "text". */
  kind?: PlacementKind;
  /** Dotted path into {@link CertificateData}. */
  path: string;
  x: number;
  y: number;
  /** Text size in pt, or radius for `passCircle`. */
  size?: number;
  format?: (value: string, data: CertificateData) => string;
  when?: (data: CertificateData) => boolean;
}

/** Calibrated mapping for one blank template (spec §5.2). */
export interface TemplateMapper {
  /** e.g. "uber_usa_ca". */
  key: string;
  /** Path relative to `app/lib/pdf-assets/`. */
  blankPdfPath: string;
  /** Zero-based page index. Default 0. */
  page?: number;
  placements: readonly Placement[];
  decorate?: (ctx: DrawContext, data: CertificateData) => void;
}