"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/app/components/Button";
import { cn } from "@/lib/utils";
import {
  APPROVAL_GROUPS,
  PASS_FAIL_OPTIONS,
  YES_NO_OPTIONS,
  type ApprovalFieldContext,
  type ApprovalFieldDef,
} from "@/app/lib/approval-fields";
import type { InspectionDetail } from "@/app/lib/types";
import { useInspectionStore } from "@/app/store/inspectionStore";

const INPUT_CLASS =
  "h-12 w-full rounded-md border-0 bg-gray-50 px-4 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-100 transition-all placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

const SELECT_CLASS = cn(
  INPUT_CLASS,
  "appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat",
);

interface FieldControlProps {
  field: ApprovalFieldDef;
  name: string;
  value: string;
  onChange: (value: string) => void;
}

function FieldControl({ field, name, value, onChange }: FieldControlProps) {
  if (field.type === "readonly") {
    return (
      <p className="min-h-12 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
        {value || "—"}
      </p>
    );
  }

  if (field.type === "passfail" || field.type === "yesno") {
    const options =
      field.type === "passfail" ? PASS_FAIL_OPTIONS : YES_NO_OPTIONS;
    return (
      <div className="flex min-h-12 items-center gap-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="size-4 accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">Select…</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      id={name}
      type={field.type}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_CLASS}
    />
  );
}

// Main fields that show prominently
const MAIN_FIELDS = [
  "hostName",
  "hostEmail",
  "hostPhoneNumber",
  "inspectionDate",
  "licensePlateNumber",
  "vin",
  "vehicleMake",
  "vehicleModel",
  "vehicleYear",
  "vehicleColor",
  "vehicleMileage",
];

// Advanced fields that go in the collapsible section
const ADVANCED_FIELDS = [
  "tncLicensePlatesLast4Digit",
  "hasRegistrationSticker",
  "registrationStickerMonthyear",
  "zip",
  "tiresOlderThan6Years",
  "batteryOlderThan5Years",
  "voltageGreaterThan12_1V",
  "minPerManufacturerFront",
  "minPerManufacturerRear",
  "frontBrakeLeft",
  "frontBrakeRight",
  "rearBrakeLeft",
  "rearBrakeRight",
  "tireRightFrontDepth",
  "tireLeftFrontDepth",
  "tireRightRearDepth",
  "tireLeftRearDepth",
  "inspectionStateUsa",
  "inspectionStateCanada",
  "vehicleNumberofDoors",
  "numberOfSeatbelts",
  "fuelType",
  "facilityName",
  "facilityAddress",
  "street",
  "location",
  "handlerName",
  "handlerSignature",
];

// REMOVED FIELDS - Not needed for explicit company forms
const REMOVED_FIELDS = [
  "inspectionCountry", // Redundant - company form already knows the country
  "inspectionCompanies", // Redundant - explicit by which form is open
  "state", // Facility state - populated from WordPress defaults
];

interface ApprovalCompanyFormProps {
  company: string;
  companyLabel: string;
  country: "USA" | "Canada";
  initialValues: Record<string, string>;
  inspection: InspectionDetail;
  templateKey: string;
}

export default function ApprovalCompanyForm({
  company,
  companyLabel,
  country,
  initialValues,
  inspection,
  templateKey,
}: ApprovalCompanyFormProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const { approvalCardState, setApprovalCardState } = useInspectionStore();

  const inspectionKey = inspection.id;
  const existingCardState = approvalCardState[inspectionKey] || {
    inspectionId: inspection.id,
    mergedOverrides: {},
    certificates: {},
    generatedBy: { lyft: false, uber: false, turo: false },
    savedBy: { lyft: false, uber: false, turo: false },
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  const fieldContext: ApprovalFieldContext = { country, company };

  const defaultValueContext: ApprovalFieldContext & {
    session?: { name?: string };
  } = {
    country,
    company,
    session: user ? { name: user.name || "" } : undefined,
  };

  const getDefaultValue = (field: ApprovalFieldDef): string => {
    if (!existingCardState.mergedOverrides[field.name]) {
      if (initialValues[field.name]) {
        return initialValues[field.name];
      }
    }

    if (existingCardState.mergedOverrides[field.name]) {
      return existingCardState.mergedOverrides[field.name];
    }

    if (field.defaultValue !== undefined) {
      return typeof field.defaultValue === "function"
        ? field.defaultValue(defaultValueContext)
        : field.defaultValue;
    }

    return field.placeholder || "";
  };

  const getInitialValues = (): Record<string, string> => {
    const allFieldNames = APPROVAL_GROUPS.flatMap((g) =>
      g.fields.map((f) => f.name),
    );
    const values: Record<string, string> = {};

    allFieldNames.forEach((name) => {
      const field = APPROVAL_GROUPS.flatMap((g) => g.fields).find(
        (f) => f.name === name,
      );
      if (field) {
        values[name] = getDefaultValue(field);
      } else {
        values[name] = initialValues[name] || "";
      }
    });

    return values;
  };

  const [values, setValues] = useState<Record<string, string>>(() =>
    getInitialValues(),
  );
  const [generated, setGenerated] = useState(
    existingCardState.generatedBy[company as "lyft" | "uber" | "turo"] || false,
  );
  const [saved, setSaved] = useState(
    existingCardState.savedBy[company as "lyft" | "uber" | "turo"] || false,
  );
  // Local state for certificate URL (data URL during generation, CDN URL after save)
  const [certificateData, setCertificateData] = useState<string | null>(() => {
    const state = approvalCardState[inspectionKey];
    return state?.certificates?.[company as "lyft" | "uber" | "turo"] || null;
  });
  const [saving, setSaving] = useState(false);

  const updateField = (fieldName: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleGenerate = async () => {
    // Reset saved state when regenerating
    setSaved(false);
    setGenerated(true);
    try {
      const { generateCertificate } = await import("@/app/actions/certificate");

      const overrides: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value) overrides[key] = value;
      }

      const result = await generateCertificate(inspection.id, {
        company,
        seed: Date.now(),
        overrides,
      });

      if (result.previewUrl) {
        try {
          const base64Data = result.previewUrl.split(",")[1];
          if (!base64Data) {
            window.open(result.previewUrl, "_blank", "noopener,noreferrer");
            return;
          }

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);

          const newWindow = window.open(
            blobUrl,
            "_blank",
            "noopener,noreferrer",
          );
          if (!newWindow) {
            alert(
              "Popup blocked! Please allow popups for this site and click Generate again.",
            );
          } else {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          }
        } catch (convertError) {
          console.warn(
            "Blob conversion failed, falling back to data URL:",
            convertError,
          );
          window.open(result.previewUrl, "_blank", "noopener,noreferrer");
        }
      }

      setApprovalCardState(inspectionKey, company as "lyft" | "uber" | "turo", {
        overrides: values,
        certificateUrl: result.previewUrl,
        generated: true,
        saved: false,
      });
      // Store locally for save operation
      setCertificateData(result.previewUrl);
    } catch (err) {
      console.error("Certificate generation failed:", err);
      setGenerated(false);
      toast.error(
        err instanceof Error
          ? `Failed to generate certificate: ${err.message}`
          : "Failed to generate certificate. Please try again.",
      );
    }
  };

  const handleSave = async () => {
    if (!generated || !certificateData) return;

    setSaving(true);
    try {
      const { saveCertificateToCDN } =
        await import("@/app/actions/certificate");

      // Upload to Bunny CDN
      const { publicUrl } = await saveCertificateToCDN(
        certificateData,
        company as "lyft" | "uber" | "turo",
        inspectionKey,
      );

      // Update Zustand with CDN URL
      setApprovalCardState(inspectionKey, company as "lyft" | "uber" | "turo", {
        certificates: {
          [company as "lyft" | "uber" | "turo"]: publicUrl,
        },
        saved: true,
      });

      setSaved(true);
      setCertificateData(publicUrl);
      toast.success("Certificate saved to CDN successfully");
    } catch (err) {
      console.error("Failed to save certificate:", err);
      toast.error(
        err instanceof Error
          ? `Failed to save certificate: ${err.message}`
          : "Failed to save certificate. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Get all fields
  const allFields = APPROVAL_GROUPS.flatMap((g) => g.fields);

  // Filter main fields (exclude Country and Companies)
  const mainFields = allFields.filter(
    (f) => MAIN_FIELDS.includes(f.name) && !REMOVED_FIELDS.includes(f.name),
  );

  // Filter advanced fields (exclude removed fields)
  const advancedFields = allFields.filter(
    (f) => ADVANCED_FIELDS.includes(f.name) && !REMOVED_FIELDS.includes(f.name),
  );

  // Get visible fields based on context
  const visibleMainFields = mainFields.filter(
    (field) => !field.visibleFor || field.visibleFor(fieldContext),
  );
  const visibleAdvancedFields = advancedFields.filter(
    (field) => !field.visibleFor || field.visibleFor(fieldContext),
  );

  return (
    <div className="space-y-6">
      {/* Main Fields Section */}
      <section className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Inspection Details
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "hostName",
            "hostEmail",
            "hostPhoneNumber",
            "inspectionDate",
            "licensePlateNumber",
            "vin",
            "vehicleMake",
            "vehicleModel",
            "vehicleYear",
            "vehicleColor",
            "vehicleMileage",
          ]
            .map((name) => allFields.find((f) => f.name === name))
            .filter(Boolean)
            .map((field) => (
              <div key={field!.name} className="flex flex-col gap-1">
                <label
                  htmlFor={`${company}-${field!.name}`}
                  className="text-sm font-semibold text-gray-700"
                >
                  {field!.label}
                </label>
                <FieldControl
                  field={field!}
                  name={`${company}-${field!.name}`}
                  value={values[field!.name] ?? ""}
                  onChange={(newValue) => updateField(field!.name, newValue)}
                />
              </div>
            ))}
        </div>
      </section>

      {/* Advanced Fields Section */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <span>Advanced Settings</span>
          <span className="text-gray-500">{showAdvanced ? "▲" : "▼"}</span>
        </button>

        {showAdvanced && (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleAdvancedFields.map((field) => (
              <div
                key={field.name}
                className={cn(
                  "flex flex-col gap-1",
                  field.type === "readonly" && "md:col-span-2",
                )}
              >
                <label
                  htmlFor={`${company}-${field.name}`}
                  className="text-sm font-semibold text-gray-700"
                >
                  {field.label}
                </label>
                <FieldControl
                  field={field}
                  name={`${company}-${field.name}`}
                  value={values[field.name] ?? ""}
                  onChange={(newValue) => updateField(field.name, newValue)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="!w-auto !px-6"
          onClick={handleGenerate}
        >
          {saved ? (
            <span className="mr-2 text-emerald-600">✓</span>
          ) : (
            <span
              aria-hidden
              className="size-4 rounded-full border-2 border-white/70 mr-2"
            />
          )}
          Generate
        </Button>

        {generated && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!w-auto !px-6"
            onClick={handleSave}
            disabled={saved || saving}
          >
            {saved ? (
              "Saved"
            ) : saving ? (
              "Saving..."
            ) : (
              "Save"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
