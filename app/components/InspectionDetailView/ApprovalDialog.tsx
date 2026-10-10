"use client";

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
import type { InspectionDetail } from "@/app/lib/types";

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
    values.inspectionCompanies = inspection.companies
      .map((c) => APPROVAL_COMPANY_LABELS[c] ?? c)
      .join(", ");
    return values;
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
                    mapVin={getTemplateKey(company).includes("il")}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!w-auto !px-8"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
