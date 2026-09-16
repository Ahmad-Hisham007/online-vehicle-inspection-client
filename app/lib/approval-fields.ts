import { US_STATES, CA_PROVINCES } from "@/app/lib/constants";

export type ApprovalFieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "tel"
  | "select"
  | "yesno"
  | "passfail"
  | "readonly";

export interface ApprovalFieldContext {
  country: "USA" | "Canada";
  company: string;
}

export interface ApprovalFieldDef {
  /** GraphQL/ACF field name — matches the key in InspectionDetail.approvalFields. */
  name: string;
  label: string;
  type: ApprovalFieldType;
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
  /** Per-company / per-location visibility. Default: visible everywhere. */
  visibleFor?: (ctx: ApprovalFieldContext) => boolean;
}

export interface ApprovalGroup {
  id: string;
  label: string;
  fields: ApprovalFieldDef[];
}

export const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export const PASS_FAIL_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
] as const;

const FUEL_TYPE_OPTIONS = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "hydrogen", label: "Hydrogen" },
] as const;

const COUNTRY_OPTIONS = [
  { value: "USA", label: "USA" },
  { value: "Canada", label: "Canada" },
] as const;

export const APPROVAL_COMPANY_LABELS: Record<string, string> = {
  lyft: "Lyft",
  uber: "Uber",
  turo: "Turo",
};

/** Companies that own a certificate field in WordPress. */
export const APPROVAL_CERTIFICATE_COMPANIES = Object.keys(
  APPROVAL_COMPANY_LABELS,
);

export const APPROVAL_GROUPS: readonly ApprovalGroup[] = [
  {
    id: "vehicle",
    label: "Vehicle",
    fields: [
      { name: "vehicleMake", label: "Make", type: "text", placeholder: "E.g. Toyota" },
      { name: "vehicleModel", label: "Model", type: "text", placeholder: "E.g. Camry" },
      { name: "vehicleYear", label: "Year", type: "number", placeholder: "E.g. 2020" },
      { name: "vehicleColor", label: "Color", type: "text", placeholder: "E.g. Silver" },
      { name: "vehicleMileage", label: "Mileage", type: "number", placeholder: "E.g. 50000" },
      { name: "vin", label: "VIN", type: "text", placeholder: "17-character VIN" },
      { name: "numberOfDoors", label: "Number of doors", type: "number" },
      { name: "numberOfSeatbelts", label: "Number of seatbelts", type: "number" },
      {
        name: "fuelType",
        label: "Fuel type",
        type: "select",
        options: FUEL_TYPE_OPTIONS,
      },
    ],
  },
  {
    id: "registration",
    label: "Registration",
    fields: [
      {
        name: "licensePlateNumber",
        label: "License plate",
        type: "text",
        placeholder: "E.g. ABC123",
      },
      {
        name: "tncLicesnePlatesLast4Digit",
        label: "TNC (last 4 of plate)",
        type: "text",
        placeholder: "E.g. 1234",
      },
      {
        name: "hasRegistrationSticker",
        label: "Has registration sticker",
        type: "passfail",
      },
      {
        name: "registrationStickerMonthyear",
        label: "Registration sticker (MM/YYYY)",
        type: "text",
        placeholder: "MM/YYYY",
      },
      { name: "zip", label: "Zip", type: "text", placeholder: "ZIP / postal code" },
    ],
  },
  {
    id: "condition",
    label: "Condition",
    fields: [
      {
        name: "tiresOlderThan6Years",
        label: "Tires older than 6 years",
        type: "yesno",
      },
      {
        name: "batteryOlderThan5Years",
        label: "Battery older than 5 years",
        type: "yesno",
      },
      {
        name: "voltageGreaterThan12_1V",
        label: "Voltage greater than 12.1V",
        type: "yesno",
      },
    ],
  },
  {
    id: "brakes",
    label: "Brakes",
    fields: [
      {
        name: "minPerManufacturerFront",
        label: "Min. per manufacturer (front)",
        type: "number",
      },
      {
        name: "minPerManufacturerRear",
        label: "Min. per manufacturer (rear)",
        type: "number",
      },
      { name: "frontBrakeLeft", label: "Front brake left", type: "passfail" },
      { name: "frontBrakeRight", label: "Front brake right", type: "passfail" },
      { name: "rearBrakeLeft", label: "Rear brake left", type: "passfail" },
      { name: "rearBrakeRight", label: "Rear brake right", type: "passfail" },
    ],
  },
  {
    id: "tires",
    label: "Tires",
    fields: [
      { name: "tireRightFrontDepth", label: "Tire right front depth", type: "number" },
      { name: "tireLeftFrontDepth", label: "Tire left front depth", type: "number" },
      { name: "tireRightRearDepth", label: "Tire right rear depth", type: "number" },
      { name: "tireLeftRearDepth", label: "Tire left rear depth", type: "number" },
    ],
  },
  {
    id: "inspection",
    label: "Inspection",
    fields: [
      { name: "inspectionDate", label: "Inspection date", type: "date" },
      {
        name: "inspectionCountry",
        label: "Country",
        type: "select",
        options: COUNTRY_OPTIONS,
      },
      {
        name: "inspectionStateUsa",
        label: "State (USA)",
        type: "select",
        options: US_STATES,
        visibleFor: (ctx) => ctx.country === "USA",
      },
      {
        name: "inspectionStateCanada",
        label: "Province (Canada)",
        type: "select",
        options: CA_PROVINCES,
        visibleFor: (ctx) => ctx.country === "Canada",
      },
      {
        name: "inspectionCompanies",
        label: "Companies",
        type: "readonly",
      },
    ],
  },
  {
    id: "handler",
    label: "Handler",
    fields: [
      { name: "handlerName", label: "Handler name", type: "text" },
      { name: "handlerSignature", label: "Handler signature", type: "text" },
    ],
  },
  {
    id: "host",
    label: "Host",
    fields: [
      { name: "hostName", label: "Host name", type: "text" },
      { name: "hostEmail", label: "Host email", type: "email", placeholder: "host@example.com" },
      { name: "hostPhoneNumber", label: "Host phone", type: "tel", placeholder: "(555) 555-5555" },
    ],
  },
];

/** Fields to render for a company at a location. */
export function getVisibleFields(
  ctx: ApprovalFieldContext,
): ApprovalFieldDef[] {
  return APPROVAL_GROUPS.flatMap((group) => group.fields).filter(
    (field) => !field.visibleFor || field.visibleFor(ctx),
  );
}
