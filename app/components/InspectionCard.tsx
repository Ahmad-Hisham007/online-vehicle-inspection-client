"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import StatusBadge from "@/app/components/StatusBadge";
import { formatInspectionDate } from "@/app/lib/format";
import type { InspectionSummary } from "@/app/lib/types";

interface InspectionCardProps {
  inspection: InspectionSummary;
}

export default function InspectionCard({ inspection }: InspectionCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const isUnpaid = inspection.paymentStatus !== "succeeded";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-2 divide-x divide-border p-4 md:p-5">
        <div className="pr-4">
          <p className="text-sm font-medium text-muted-foreground">
            License Plate No.
          </p>
          <p className="mt-0.5 font-heading text-base font-bold text-foreground">
            {inspection.licensePlate}
          </p>
        </div>
        <div className="pl-4 text-right">
          <p className="text-sm font-medium text-muted-foreground">
            Date Created
          </p>
          <p className="mt-0.5 font-heading text-base font-bold text-foreground">
            {formatInspectionDate(inspection.dateCreated)}
          </p>
        </div>
      </div>

      <div className="border-b border-border" />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/50"
        aria-expanded={isOpen}
      >
        <span className="text-sm text-muted-foreground">Status</span>
        <span className="flex items-center gap-2">
          {isOpen ? (
            <FiChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <FiChevronDown className="size-4 text-muted-foreground" />
          )}
        </span>
        <StatusBadge status={inspection.inspectionStatus} size="sm" />
      </button>

      {isOpen && (
        <div className="flex flex-col items-center gap-3 pt-2 pb-4">
          {isUnpaid && (
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/customer/pay/${inspection.id}`)
              }
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Payment Link
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/customer/inspection/${inspection.id}`)
            }
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Car details
          </button>
        </div>
      )}
    </div>
  );
}