"use client";

import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/app/components/Button";
import ApprovalCompanyForm from "@/app/components/InspectionDetailView/ApprovalCompanyForm";
import {
  APPROVAL_CERTIFICATE_COMPANIES,
  APPROVAL_COMPANY_LABELS,
} from "@/app/lib/approval-fields";
import { useInspectionStore } from "@/app/store/inspectionStore";
import type { InspectionDetail } from "@/app/lib/types";
import { useState } from "react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: InspectionDetail;
}

/**
 * Normalize state for template key generation.
 * - For IL (Chicago): returns "il" (non-chicago key won't exist until we create a proper IL template)
 * - For other states: returns uppercase state code
 * - For Turo: returns "all" (all-states template)
 *
 * TODO: Create proper il template for non-chicago IL inspections
 */
function normalizeStateForTemplate(
  company: string,
  state: string,
  country: string,
): string {
  const stateUpper = state.toUpperCase();
  const companyLower = company.toLowerCase();

  // Turo uses all-states template
  if (companyLower === "turo") {
    return "all";
  }

  // For other companies, return the state code uppercase
  // Note: IL specifically needs 'il' for the template key
  return stateUpper;
}

export default function ApprovalDialog({
  open,
  onOpenChange,
  inspection,
}: ApprovalDialogProps) {
  const country = inspection.location.country === "Canada" ? "Canada" : "USA";
  const companies = inspection.companies.filter((company) =>
    APPROVAL_CERTIFICATE_COMPANIES.includes(company),
  );
  const [isApproving, setIsApproving] = useState(false);
  /**
   * Compute the template key for a company.
   * Format: company_country_state (e.g., "lyft_usa_il")
   */
  const getTemplateKey = (company: string): string => {
    // For non-Canada countries, treat as USA
    const countryLower = country.toLowerCase();
    const stateKey = inspection.location.state.toUpperCase();

    return `${company.toLowerCase()}_${countryLower}_${stateKey}`;
  };

  const companyValues = (): Record<string, string> => {
    const values: Record<string, string> = { ...inspection.approvalFields };
    return values;
  };

  // Get all certificate URLs from Zustand store
  const { approvalCardState } = useInspectionStore();
  const inspectionKey = inspection.id;
  const approvalState = approvalCardState[inspectionKey];
  const certificateUrls = approvalState?.certificates || {};
  const isAllSaved = companies.every(
    (c) => approvalState?.savedBy?.[c as "lyft" | "uber" | "turo"],
  );
  const hasAnyCertificate = companies.some(
    (c) =>
      (c === "lyft" && !!certificateUrls.lyft) ||
      (c === "uber" && !!certificateUrls.uber) ||
      (c === "turo" && !!certificateUrls.turo),
  );

  const handleApprove = async () => {
    // Get merged overrides from Zustand state
    const mergedOverrides = approvalState?.mergedOverrides || {};
    const certificates = certificateUrls;

    // Check if all required companies have certificates
    const missingCertificates = companies.filter(
      (c) => !certificates[c as "lyft" | "uber" | "turo"],
    );

    if (missingCertificates.length > 0) {
      const names = missingCertificates
        .map((c) => APPROVAL_COMPANY_LABELS[c])
        .join(", ");
      toast.error(`Missing certificates for: ${names}`);
      return;
    }

    if (Object.keys(mergedOverrides).length === 0) {
      toast.error("No inspection data to approve");
      return;
    }

    try {
      setIsApproving(true);
      const { approveInspection } = await import("@/app/actions/admin");
      await approveInspection(
        inspection.id,
        String(inspection.author?.node.databaseId),
        {
          mergedOverrides,
          certificates,
        },
      );
      toast.success("Inspection approved successfully!");
      onOpenChange(false);
      setIsApproving(false);
    } catch (err) {
      console.error("Failed to approve inspection:", err);
      toast.error(
        err instanceof Error
          ? `Failed to approve inspection: ${err.message}`
          : "Failed to approve inspection. Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-center text-primary sm:text-center">
            Approve inspection
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            Review each company&apos;s details, generate the certificate and
            save it before approving.
          </DialogDescription>
        </DialogHeader>

        {companies.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No certificate companies on this inspection.
          </p>
        ) : (
          <>
            <Accordion
              type="multiple"
              defaultValue={companies}
              className="space-y-3"
            >
              {companies.map((company) => (
                <AccordionItem
                  className="border border-stone-200"
                  key={company}
                  value={company}
                >
                  <AccordionTrigger>
                    {APPROVAL_COMPANY_LABELS[company] ?? company}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ApprovalCompanyForm
                      company={company}
                      companyLabel={APPROVAL_COMPANY_LABELS[company] ?? company}
                      country={country}
                      initialValues={companyValues()}
                      inspection={inspection}
                      templateKey={getTemplateKey(company)}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Sticky Approve Button Footer */}
            <div className="mt-4 flex flex-col items-center gap-3 pt-2 border-t border-stone-200">
              {!isAllSaved && !hasAnyCertificate ? (
                <p className="text-sm text-muted-foreground">
                  Generate and save certificates for all companies before
                  approving
                </p>
              ) : !isAllSaved ? (
                <p className="text-sm text-amber-600">
                  All certificates generated. Save them before approving.
                </p>
              ) : null}
            </div>
          </>
        )}

        {/* Sticky Footer with Approve and Close buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!w-auto !px-6"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {isAllSaved && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="!w-auto !px-6"
              disabled={isApproving}
              onClick={handleApprove}
            >
              {(isApproving && (
                <span className="flex gap-1.5 items-center">
                  <span className="w-5 h-5 shrink-0 border-2 border-white/65 border-l-0 rounded-full animate-spin"></span>{" "}
                  <span>Approving ...</span>
                </span>
              )) ||
                "Approve"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
