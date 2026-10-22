"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/Button";
import RejectDialog from "@/app/components/InspectionDetailView/RejectDialog";
import ApprovalDialog from "@/app/components/InspectionDetailView/ApprovalDialog";
import { canApproveInspection, canRejectInspection } from "@/app/lib/status";
import type { InspectionDetail } from "@/app/lib/types";
import { IoMdDownload } from "react-icons/io";
import ReturnDialog from "./ReturnDialog";
import { LoadingIndicator } from "@/app/components/LoadingIndicator";

/**
 * Download a PDF URL as a proper file.
 * Handles both regular URLs and data URLs.
 */
export function downloadPdf(url: string, filename: string): void {
  // If it's a data URL, we need to convert it to a Blob for download
  if (url.startsWith("data:application/pdf")) {
    const byteString = atob(url.split(",")[1]);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(byteString).charCodeAt(0);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } else {
    // For regular URLs, create a hidden download link
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

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
  const [isActionPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const isApproved = inspection.inspectionStatus === "approved";
  const isRejected = inspection.inspectionStatus === "rejected";
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
  } else if (isRejected) {
    message =
      "Your Inspection is rejected, please check the reason and invalid fields and re-inspect";
  } else if (isPaid) {
    message = "Payment received. Certificates will be available once approved.";
  } else {
    message = "This inspection requires payment.";
  }

  // Handler to trigger revalidation after an action completes
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      {isActionPending && (
        <div
          aria-label="Loading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-8 shadow-lg">
            <LoadingIndicator variant="spinner" size="xl" />
            <p className="text-sm text-muted-foreground">Updating inspection...</p>
          </div>
        </div>
      )}
      <div className="p-6 bg-gray-50 space-y-3">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 space-x-2 items-start">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-foreground">Certificates</p>
            {isApproved && availableCertificates.length > 0 ? (
              <div className="mt-1 w-full order-3 grid md:grid-cols-3 grid-cols-1 gap-x-3 gap-y-1">
                {availableCertificates.map(({ key, label }) => {
                  const url = inspection.certificates[key];
                  if (!url) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        downloadPdf(
                          url,
                          `certificate-${inspection.id}-${key}.pdf`,
                        )
                      }
                      className="font-medium text-center text-primary border-2 rounded-xl border-slate-300 py-2.5 px-4 hover:border-primary flex  justify-center items-center gap-2"
                    >
                      {key} <IoMdDownload />
                    </button>
                  );
                })}
              </div>
            ) : (
              message && <p className="mt-1 text-muted-foreground">{message}</p>
            )}
          </div>
          {role === "customer" ? (
            !isPaid && (
              <Button
                variant="primary"
                size="sm"
                className="px-6! shrink-0 w-auto min-w-22"
                onClick={() =>
                  router.push(`/dashboard/customer/pay/${inspection.id}`)
                }
              >
                Pay
              </Button>
            )
          ) : inspection.inspectionStatus === "approved" ||
            inspection.inspectionStatus === "rejected" ? (
            <div className="flex flex-1 order-2 shrink-0 grow gap-2 [&_button]:w-full">
              <Button
                variant="primary"
                size="sm"
                className="px-5!"
                type="button"
                disabled={canApprove}
                onClick={() => setReturnOpen(true)}
              >
                Return Inspection
              </Button>
            </div>
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
        </div>

        <ReturnDialog
          open={returnOpen}
          onOpenChange={setReturnOpen}
          inspectionId={inspection.id}
          inspectionAuthorId={String(inspection.author?.node.databaseId)}
          onRefresh={handleRefresh}
        />
        <RejectDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          inspectionId={inspection.id}
          inspectionAuthorId={String(inspection.author?.node.databaseId)}
          onRefresh={handleRefresh}
        />
        <ApprovalDialog
          open={approveOpen}
          onOpenChange={setApproveOpen}
          inspection={inspection}
          onRefresh={handleRefresh}
        />
      </div>
    </>
  );
}