"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import RejectDialog from "@/app/components/InspectionDetailView/RejectDialog";
import ApprovalDialog from "@/app/components/InspectionDetailView/ApprovalDialog";
import { canApproveInspection, canRejectInspection } from "@/app/lib/status";
import type { InspectionDetail } from "@/app/lib/types";

interface CertificatesPanelProps {
  inspection: InspectionDetail;
  role: "customer" | "admin";
}

const CERTIFICATE_LABELS: {
  key: keyof InspectionDetail["certificates"];
  label: string;
}[] = [
  { key: "lyft", label: "Lyft" },
  { key: "uber", label: "Uber" },
  { key: "turo", label: "Turo" },
];

export default function CertificatesPanel({
  inspection,
  role,
}: CertificatesPanelProps) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const isApproved = inspection.inspectionStatus === "approved";
  const isPaid =
    inspection.paymentStatus === "succeeded" ||
    inspection.inspectionStatus === "paid";
  const canApprove = canApproveInspection(inspection.inspectionStatus);
  const canReject = canRejectInspection(inspection.inspectionStatus);

  const availableCertificates = CERTIFICATE_LABELS.filter(
    ({ key }) => inspection.certificates[key],
  );

  let message: string;
  if (isApproved && availableCertificates.length === 0) {
    message = "No certificates available.";
  } else if (isApproved) {
    message = "";
  } else if (isPaid) {
    message = "Payment received. Certificates will be available once approved.";
  } else {
    message = "This inspection requires payment.";
  }

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">Certificates</p>
        {isApproved && availableCertificates.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {availableCertificates.map(({ key, label }) => (
              <a
                key={key}
                href={inspection.certificates[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Download {label} certificate (PDF)
              </a>
            ))}
          </div>
        ) : (
          message && (
            <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          )
        )}
      </div>

      {role === "customer" ? (
        !isPaid && (
          <Button
            variant="primary"
            size="sm"
            className="w-full! px-6! shrink-0"
            onClick={() =>
              router.push(`/dashboard/customer/pay/${inspection.id}`)
            }
          >
            Pay
          </Button>
        )
      ) : (
        <div className="flex shrink-0 grow gap-2 [&_button]:w-full">
          <Button
            variant="primary"
            size="sm"
            className="px-5!"
            type="button"
            disabled={!canApprove}
            onClick={() => setApproveOpen(true)}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className=" px-5!"
            type="button"
            disabled={!canReject}
            onClick={() => setRejectOpen(true)}
          >
            Reject
          </Button>
        </div>
      )}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        inspectionId={inspection.id}
      />
      <ApprovalDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        inspection={inspection}
      />
    </div>
  );
}
