"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

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
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  const ctx: ApprovalFieldContext = { country, company };

  const updateField = (fieldName: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  /**
   * Generate a certificate PDF and open it in a new tab.
   * Uses Blob URL for efficient PDF preview (faster than data URL).
   */
  const handleGenerate = async () => {
    setGenerated(true); // Optimistic UI - show Save button immediately
    try {
      // Import and call the server action
      const { generateCertificate } = await import(
        "@/app/actions/certificate"
      );

      // Build overrides from form values (whitelisted fields)
      const overrides: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value) overrides[key] = value;
      }

      const result = await generateCertificate(inspection.id, {
        company,
        seed: Date.now(), // Add a seed for random but reproducible layout
        overrides,
      });

      // Convert data URL to Blob URL for faster loading
      // This avoids the overhead of passing massive base64 strings through window.open()
      if (result.previewUrl) {
        try {
          // Extract base64 data after the comma
          const base64Data = result.previewUrl.split(',')[1];
          if (!base64Data) {
            // Fallback: try opening directly if not a data URL
            window.open(result.previewUrl, "_blank", "noopener,noreferrer");
            return;
          }

          // Decode base64 to binary string
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create Blob and Blob URL
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);

          // Open with Blob URL (instant tab opening)
          const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
          // If popup is blocked, show an alert to the user
          if (!newWindow) {
            alert("Popup blocked! Please allow popups for this site and click Generate again.");
          } else {
            // Revoke the Blob URL after a delay to free memory
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          }
        } catch (convertError) {
          // Fallback to direct data URL if Blob conversion fails
          console.warn("Blob conversion failed, falling back to data URL:", convertError);
          window.open(result.previewUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      console.error("Certificate generation failed:", err);
      // Reset generated state on error so user can retry
      setGenerated(false);
      alert(
        err instanceof Error
          ? `Failed to generate certificate: ${err.message}`
          : "Failed to generate certificate. Please try again.",
      );
    }
  };

  const handleSave = () => {
    // TODO(phase 6.4): persist the generated certificate to the inspection post.
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {APPROVAL_GROUPS.map((group) => {
        const fields = group.fields.filter(
          (field) => !field.visibleFor || field.visibleFor(ctx),
        );
        if (fields.length === 0) return null;

        return (
          <section key={group.id} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
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
                    onChange={(value) => updateField(field.name, value)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="!w-auto !px-6"
          onClick={handleGenerate}
        >
          {generated ? (
            <HugeiconsIcon
              icon={Tick02Icon}
              className="size-4 text-emerald-200"
            />
          ) : (
            <span
              aria-hidden
              className="size-4 rounded-full border-2 border-white/70"
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
            disabled={saved}
          >
            {saved ? "Saved" : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}