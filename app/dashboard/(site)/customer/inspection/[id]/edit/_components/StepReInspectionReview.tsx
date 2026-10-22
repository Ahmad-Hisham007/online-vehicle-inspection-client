"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/app/components/Button";
import { PriceSummary } from "@/app/components/PriceSummary";
import { LoadingIndicator } from "@/app/components/LoadingIndicator";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { submitReInspection } from "@/app/actions/inspection";
import type { InspectionFormData } from "@/app/actions/inspection";
import toast from "react-hot-toast";

const reviewSchema = z.object({
  userAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the User Agreement"),
  inspectionAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the Inspection Agreement"),
});

type ReviewInputs = z.infer<typeof reviewSchema>;

interface Props {
  inspectionId: string;
  onBack: () => void;
}

export default function StepReInspectionReview({ inspectionId, onBack }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    vehicleInfo,
    vinInfo,
    inspectionScope,
    uploadFields,
    updateReviewAgreement,
    reset,
  } = useInspectionStore(
    useShallow((s) => ({
      vehicleInfo: s.vehicleInfo,
      vinInfo: s.vinInfo,
      inspectionScope: s.inspectionScope,
      uploadFields: s.uploadFields,
      updateReviewAgreement: s.updateReviewAgreement,
      reset: s.reset,
    })),
  );

  const form = useForm<ReviewInputs>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      userAgreement: false,
      inspectionAgreement: false,
    },
  });

  const allMediaUploaded = uploadFields
    ? Object.values(uploadFields).every(
        (f) => f?.status === "done" || f?.status === "error",
      )
    : false;

  // Helper to get canvas data
  const getSignatureData = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((v) => v !== 0);
    if (!hasContent) return null;
    return canvas.toDataURL("image/png");
  };

  const onSubmit = async (data: ReviewInputs) => {
    const signatureDataUrl = getSignatureData();
    if (!signatureDataUrl) {
      toast.error("Please provide a signature");
      return;
    }

    updateReviewAgreement(data);
    setIsSubmitting(true);

    try {
      const formData: InspectionFormData = {
        vehicleInfo,
        vinInfo,
        inspectionScope,
        uploadFields,
        reviewAgreement: data,
      };

      await submitReInspection(inspectionId, formData, signatureDataUrl);

      toast.success("Re-inspection submitted successfully!");
      reset();
      router.push(`/dashboard/customer/inspection/${inspectionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit re-inspection",
      );
      setIsSubmitting(false);
    }
  };

  // --- Canvas drawing handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    currentX = e.clientX - rect.left;
    currentY = e.clientY - rect.top;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = e.currentTarget;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(x, y);
      ctx.stroke();

      currentX = x;
      currentY = y;
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDrawing = false;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <form
      id="step-7"
      // eslint-disable-next-line react-hooks/refs -- false positive: onSubmit accesses canvasRef only inside async callback, not during render
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Order Summary */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-inset ring-gray-100">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Order Summary
        </h4>

        {vinInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">Vehicle</p>
              <p className="text-gray-900">
                {vinInfo.make} {vinInfo.model} {vinInfo.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">Fuel Type</p>
              <p className="text-gray-900 capitalize">{vinInfo.fuelType}</p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">VIN</p>
              <p className="text-gray-900 font-mono text-xs">{vinInfo.vin}</p>
            </div>
            {vehicleInfo?.mileage && (
              <div>
                <p className="text-xs text-primary font-medium">Mileage</p>
                <p className="text-gray-900">
                  {vehicleInfo.mileage.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {vehicleInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">License Plate</p>
              <p className="text-gray-900">{vehicleInfo.licensePlate}</p>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <PriceSummary companies={inspectionScope?.companies ?? []} />

        <div className="mt-4 text-center py-4">
          <span className="text-2xl font-bold text-green-600">$0.00</span>
          <p className="text-sm text-gray-500">
            Re-inspection Fee (No payment required)
          </p>
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-inset ring-gray-100">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Signature
        </h4>
        <p className="text-sm text-gray-500 mb-2">
          Please sign below to submit your re-inspection
        </p>

        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-40 rounded-lg border border-gray-300 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="flex justify-between mt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear signature
          </button>
        </div>
      </div>

      {/* Agreements */}
      <FieldGroup className="gap-4">
        <Controller
          name="userAgreement"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="userAgreement"
                  checked={!!field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <label
                  htmlFor="userAgreement"
                  className="text-sm text-gray-700 font-normal cursor-pointer leading-snug"
                >
                  I accept the{" "}
                  <span className="text-primary underline cursor-pointer">
                    User Agreement
                  </span>
                </label>
              </div>
              {fieldState.error && (
                <p className="text-xs text-red-500 ml-9">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="inspectionAgreement"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="inspectionAgreement"
                  checked={!!field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <label
                  htmlFor="inspectionAgreement"
                  className="text-sm text-gray-700 font-normal cursor-pointer leading-snug"
                >
                  I accept the{" "}
                  <span className="text-primary underline cursor-pointer">
                    Inspection Agreement
                  </span>
                </label>
              </div>
              {fieldState.error && (
                <p className="text-xs text-red-500 ml-9">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </FieldGroup>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !allMediaUploaded}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <LoadingIndicator variant="spinner" size="sm" />
              Submitting...
            </div>
          ) : (
            "Submit Re-inspection"
          )}
        </Button>
      </div>
    </form>
  );
}

// Drawing state for signature canvas
let isDrawing = false;
let currentX = 0;
let currentY = 0;
