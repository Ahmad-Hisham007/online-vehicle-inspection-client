import { getPaymentStatusLabel } from "@/app/lib/status";
import { formatInspectionDate } from "@/app/lib/format";
import StatusBadge from "@/app/components/StatusBadge";
import type { InspectionDetail } from "@/app/lib/types";

interface InspectionHeaderProps {
  inspection: InspectionDetail;
}

export default function InspectionHeader({ inspection }: InspectionHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          Inspection #{inspection.id}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatInspectionDate(inspection.dateCreated)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={inspection.inspectionStatus} />
        <span className="text-xs text-muted-foreground">
          Payment: {getPaymentStatusLabel(inspection.paymentStatus)}
        </span>
      </div>
    </div>
  );
}