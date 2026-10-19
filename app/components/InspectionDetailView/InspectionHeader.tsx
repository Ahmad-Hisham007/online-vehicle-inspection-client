import { getPaymentStatusLabel } from "@/app/lib/status";
import { formatInspectionDate } from "@/app/lib/format";
import StatusBadge from "@/app/components/StatusBadge";
import type { InspectionDetail } from "@/app/lib/types";

interface InspectionHeaderProps {
  inspection: InspectionDetail;
}

export default function InspectionHeader({
  inspection,
}: InspectionHeaderProps) {
  return (
    <>
      {inspection.handlerName && (
        <div className="bg-[#101828] text-white px-4 py-2.5 text-2xl text-center z-30 relative">
          Prosessed By{" "}
          <span className="ml-3 uppercase font-semibold">
            {inspection.handlerName}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2.5 shadow-[0_1px_4rem_#09a9a719,0_.25rem_2rem_#00000007] shadow-red-50">
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">
            <span className="font-heading font-bold text-foreground">
              Last Modified:
            </span>{" "}
            {formatInspectionDate(inspection.dateModified, 0)}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-heading font-bold text-foreground">
              Created at:
            </span>{" "}
            {formatInspectionDate(inspection.dateCreated, 0)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={inspection.inspectionStatus} />
          <span className="text-xs text-muted-foreground">
            Payment: {getPaymentStatusLabel(inspection.paymentStatus)}
          </span>
        </div>
      </div>
    </>
  );
}
