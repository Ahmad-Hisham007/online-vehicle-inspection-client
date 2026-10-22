"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { IoChevronDown } from "react-icons/io5";
import type { TransitionStartFunction } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/Button";
import { rejectInspection } from "@/app/actions/admin";
import {
  REJECTION_FIELDS,
  REJECTION_FIELD_LABELS,
} from "@/app/lib/rejection-fields";
import {
  rejectionSchema,
  type RejectionFormValues,
} from "@/app/lib/schemas/rejection";
import { cn } from "@/lib/utils";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  inspectionAuthorId: string;
  onRefresh: () => void;
}

export default function RejectDialog({
  open,
  onOpenChange,
  inspectionId,
  inspectionAuthorId,
  onRefresh,
}: RejectDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { invalidFields: [], rejectionReason: "" },
  });

  // Start each rejection with a clean slate
  useEffect(() => {
    if (open) reset({ invalidFields: [], rejectionReason: "" });
  }, [open, reset]);

  const onSubmit = async (values: RejectionFormValues) => {
    setIsSubmitting(true);
    try {
      await rejectInspection(inspectionId, inspectionAuthorId, values);
      toast.success("Inspection rejected");
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject inspection",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-primary sm:text-center">
            Reject inspection
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            Select the fields that failed inspection and explain what needs to
            be fixed. This will mark the inspection as rejected.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Controller
            name="invalidFields"
            control={control}
            render={({ field, fieldState }) => {
              const selected = field.value ?? [];
              const summary =
                selected.length === 0
                  ? "Select invalid fields…"
                  : selected.length <= 2
                    ? selected
                        .map((v) => REJECTION_FIELD_LABELS[v] ?? v)
                        .join(", ")
                    : `${selected.length} fields selected`;

              return (
                <Field className="flex flex-col gap-1 text-sm text-left relative">
                  <FieldLabel
                    htmlFor="invalidFields"
                    className={cn(
                      "font-semibold",
                      fieldState.invalid ? "text-red-500" : "text-gray-700",
                    )}
                  >
                    Invalid fields
                  </FieldLabel>
                  {fieldState.error && (
                    <p className="text-xs text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                  <div className="relative">
                    <select
                      id="invalidFields"
                      multiple
                      size={Math.min(Math.max(selected.length, 6), 12)}
                      value={selected}
                      onChange={(e) => {
                        const options = Array.from(
                          e.target.selectedOptions,
                          (o) => o.value,
                        );
                        field.onChange(options);
                      }}
                      className={cn(
                        "w-full cursor-pointer list-none appearance-none rounded-md border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary thin-scrollbar",
                        "h-auto min-h-[48px]",
                        selected.length === 0 && "text-gray-400",
                        fieldState.invalid && "ring-red-500",
                      )}
                    >
                      {REJECTION_FIELDS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <IoChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                      aria-hidden
                    />
                  </div>
                  <span className="mt-1 block text-xs text-gray-500">
                    {summary}
                  </span>
                </Field>
              );
            }}
          />

          <Controller
            name="rejectionReason"
            control={control}
            render={({ field, fieldState }) => (
              <Field className="flex flex-col gap-1 text-sm text-left relative">
                <FieldLabel
                  htmlFor="rejectionReason"
                  className={cn(
                    "font-semibold",
                    fieldState.invalid ? "text-red-500" : "text-gray-700",
                  )}
                >
                  Rejection reason
                </FieldLabel>
                {fieldState.error && (
                  <p className="text-xs text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
                <Textarea
                  {...field}
                  id="rejectionReason"
                  rows={4}
                  placeholder="Describe what needs to be fixed…"
                  className={cn(
                    "min-h-28 rounded-md border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-100 placeholder:text-gray-400",
                    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    fieldState.invalid && "ring-red-500",
                  )}
                />
              </Field>
            )}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!w-auto !px-8"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!w-auto !px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}