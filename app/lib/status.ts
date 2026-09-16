import {
  INSPECTION_STATUSES,
  type InspectionStatus,
  type PaymentStatus,
} from "@/app/lib/types";

export interface StatusStyle {
  label: string;
  dot: string;
  text: string;
}

export interface StatusPillStyle {
  label: string;
  className: string;
}

const INSPECTION_STATUS_META: Record<InspectionStatus, StatusStyle> = {
  pending: { label: "Pending", dot: "bg-sky-400", text: "text-sky-500" },
  paid: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-600" },
  payment_failed: {
    label: "Payment Failed",
    dot: "bg-red-500",
    text: "text-red-600",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-yellow-400",
    text: "text-yellow-600",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  rejected: { label: "Rejected", dot: "bg-red-500", text: "text-red-600" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", text: "text-gray-500" },
};

export function getStatusStyle(status: InspectionStatus): StatusStyle {
  if (!status || !INSPECTION_STATUSES.includes(status)) {
    return { label: "Unknown", dot: "bg-amber-400", text: "text-amber-500" };
  }
  return INSPECTION_STATUS_META[status];
}

export function getStatusLabel(status: InspectionStatus): string {
  if (!status || !INSPECTION_STATUSES.includes(status)) {
    return "unknown";
  }
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

const INSPECTION_STATUS_PILL_META: Record<InspectionStatus, StatusPillStyle> = {
  pending: {
    label: "Pending",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  payment_failed: {
    label: "Payment Failed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

export function getStatusPillStyle(status: InspectionStatus): StatusPillStyle {
  if (!status || !INSPECTION_STATUSES.includes(status)) {
    return {
      label: "Unknown",
      className: "bg-amber-50 text-amber-600 border-amber-200",
    };
  }
  return INSPECTION_STATUS_PILL_META[status];
}

const APPROVABLE_STATUSES: InspectionStatus[] = ["paid", "in_progress"];
const NON_REJECTABLE_STATUSES: InspectionStatus[] = [
  "paid",
  "in_progress",
  "approved",
];

/** Admin may approve only paid or in-progress inspections. */
export function canApproveInspection(status: InspectionStatus): boolean {
  return APPROVABLE_STATUSES.includes(status);
}

/** Admin may reject any inspection except paid / in-progress / already-approved. */
export function canRejectInspection(status: InspectionStatus): boolean {
  return !NON_REJECTABLE_STATUSES.includes(status);
}
