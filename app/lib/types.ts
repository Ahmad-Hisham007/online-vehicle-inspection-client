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

export type extendedInspectionStatus = InspectionStatus | null;

export const PAYMENT_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "requires_action",
  "processing",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type SortDir = "newest" | "oldest";

export interface AssignedInspectorRef {
  databaseId: number;
  name: string;
}

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
  /** Account owner (WP post author) — the driver being certified. */
  driverName: string;
  driverEmail: string;
  media: Record<MediaTab, MediaItem[]>;
  certificates: { lyft?: string; uber?: string; turo?: string };
  orderSubtotal: string;
  assignedInspector?: AssignedInspectorRef | null;
  /** Flat ACF field values (GraphQL field name → value) used to pre-fill the approve forms. */
  approvalFields: Record<string, string>;
}

// Admin Requests Types

export interface AdminRequestSummary {
  id: string;
  title: string;
  dateCreated: string;
  inspectionStatus: InspectionStatus;
  location: string | null;
  country: string | null;
  author: string;
  assignedInspector?: AssignedInspectorRef | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  phone?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  registeredDate: string;
}

export interface AdminArchiveRow {
  id: string;
  title: string;
  dateCreated: string;
  inspectionStatus: InspectionStatus;
  location: string | null;
  country: string | null;
  author: string;
  companies: string[];
  assignedInspector?: AssignedInspectorRef | null;
}
