export const INSPECTION_STATUSES = [
  "pending",
  "paid",
  "payment_failed",
  "in_progress",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "requires_action",
  "processing",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  returnUrl: string;
}

export interface PaymentStatusResponse {
  inspectionStatus: InspectionStatus;
  paymentStatus: PaymentStatus;
}
