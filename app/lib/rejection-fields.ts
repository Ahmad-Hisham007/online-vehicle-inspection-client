/**
 * Rejection field registry — the 17 checkable inspection fields an
 * admin/inspector can flag when rejecting an inspection.
 *
 * `value` is the stable internal key (never sent to WordPress);
 * `label` is what the user sees and what gets serialized into the
 * `invalidFields` rich-text HTML field.
 */

export const REJECTION_FIELDS = [
  { value: "licensePlate", label: "License plate" },
  { value: "driverSeatAdjustment", label: "Driver seat adjustment" },
  { value: "passengerSeatAdjustment", label: "Passenger seat adjustment" },
  { value: "exteriorFront", label: "Exterior front" },
  { value: "exteriorRear", label: "Exterior rear" },
  { value: "exteriorRight", label: "Exterior right" },
  { value: "exteriorLeft", label: "Exterior left" },
  { value: "horn", label: "Horn" },
  { value: "interiorBackseat", label: "Interior backseat" },
  { value: "interiorDriverSide", label: "Interior driver side" },
  { value: "interiorPassengerSide", label: "Interior passenger side" },
  { value: "tireFrontLeft", label: "Tire front left" },
  { value: "tireFrontRight", label: "Tire front right" },
  { value: "tireRearLeft", label: "Tire rear left" },
  { value: "tireRearRight", label: "Tire rear right" },
  { value: "odometer", label: "Odometer" },
  { value: "vin", label: "VIN" },
] as const;

/** Union of every valid rejection field value. */
export type RejectionFieldValue = (typeof REJECTION_FIELDS)[number]["value"];

/** Value tuple for `z.enum(REJECTION_FIELD_VALUES)`. */
export const REJECTION_FIELD_VALUES = REJECTION_FIELDS.map(
  (f) => f.value,
) as [RejectionFieldValue, ...RejectionFieldValue[]];

/** value → display label lookup. */
export const REJECTION_FIELD_LABELS: Record<string, string> =
  Object.fromEntries(REJECTION_FIELDS.map((f) => [f.value, f.label]));

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Serialize selected rejection field keys into the rich-text HTML stored in
 * WordPress. Unknown keys are ignored and output follows registry order.
 * Returns `""` when nothing valid is selected.
 */
export function rejectionFieldsToHtml(values: string[]): string {
  const selected = new Set(values);
  const labels = REJECTION_FIELDS.filter((f) => selected.has(f.value)).map(
    (f) => `<li>${escapeHtml(f.label)}</li>`,
  );

  return labels.length > 0 ? `<ul>${labels.join("")}</ul>` : "";
}
