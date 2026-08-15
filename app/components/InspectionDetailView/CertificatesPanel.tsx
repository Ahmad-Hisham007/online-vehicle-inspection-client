"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import type { InspectionDetail } from "@/app/lib/types";

interface CertificatesPanelProps {
  inspection: InspectionDetail;
  role: "customer" | "admin";
}

const CERTIFICATE_LABELS: { key: keyof InspectionDetail["certificates"]; label: string }[] = [
  { key: "lyft", label: "Lyft" },
  { key: "uber", label: "Uber" },
  { key: "turo", label: "Turo" },
];

export default function CertificatesPanel({
  inspection,
  role,
}: CertificatesPanelProps) {
  const router = useRouter();
  const isApproved = inspection.inspectionStatus === "approved";
  const isUnpaid = inspection.paymentStatus !== "succeeded";

  const availableCertificates = CERTIFICATE_LABELS.filter(
    ({ key }) => inspection.certificates[key],
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-foreground">Certificates</p>

      {isApproved && availableCertificates.length > 0 ? (
        <div className="flex flex-col gap-2">
          {availableCertificates.map(({ key, label }) => (
            <a
              key={key}
              href={inspection.certificates[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Download {label} certificate (PDF)
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isApproved
            ? "No certificates available."
            : "Certificates will be available once the inspection is approved."}
        </p>
      )}

      {role === "customer" ? (
        isUnpaid && (
          <Button
            variant="primary"
            size="sm"
            className="!w-auto !px-8"
            onClick={() =>
              router.push(`/dashboard/customer/pay/${inspection.id}`)
            }
          >
            Pay
          </Button>
        )
      ) : (
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            className="!w-auto !px-6"
            type="button"
            disabled
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="!w-auto !px-6"
            type="button"
            disabled
          >
            Reject
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            Admin actions (Phase 6)
          </span>
        </div>
      )}
    </div>
  );
}