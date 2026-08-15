import type {
  InspectionStatus,
  PaymentStatus,
} from "@/app/lib/types";

export interface StatusStyle {
  label: string;
  dot: string;
  text: string;
}

const INSPECTION_STATUS_META: Record<InspectionStatus, StatusStyle> = {
  pending: { label: "Pending", dot: "bg-sky-400", text: "text-sky-500" },
  paid: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-600" },
  payment_failed: { label: "Payment Failed", dot: "bg-red-500", text: "text-red-600" },
  in_progress: { label: "In Progress", dot: "bg-yellow-400", text: "text-yellow-600" },
  approved: { label: "Approved", dot: "bg-emerald-500", text: "text-emerald-600" },
  rejected: { label: "Rejected", dot: "bg-red-500", text: "text-red-600" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", text: "text-gray-500" },
};

export function getStatusStyle(status: InspectionStatus): StatusStyle {
  return INSPECTION_STATUS_META[status];
}

export function getStatusLabel(status: InspectionStatus): string {
  return INSPECTION_STATUS_META[status].label;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  requires_action: "Requires Action",
  processing: "Processing",
};

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}
