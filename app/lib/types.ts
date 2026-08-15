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

export interface InspectionSummary {
  id: string;
  licensePlate: string;
  dateCreated: string;
  inspectionStatus: InspectionStatus;
  paymentStatus: PaymentStatus;
}

export type MediaTab = "general" | "interior" | "exterior" | "tires";

export interface MediaItem {
  label: string;
  url: string;
  type: "image" | "video";
}

export interface InspectionDetail extends InspectionSummary {
  vin: string;
  make: string;
  model: string;
  year: string;
  fuelType: string;
  mileage: string;
  color: string;
  location: { country: string; state: string };
  companies: string[];
  inspectionDate: string;
  expiryDate: string;
  hostName: string;
  hostEmail: string;
  hostPhoneNumber: string;
  media: Record<MediaTab, MediaItem[]>;
  certificates: { lyft?: string; uber?: string; turo?: string };
  orderSubtotal: string;
}
