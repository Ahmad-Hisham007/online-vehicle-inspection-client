"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { useShallow } from "zustand/react/shallow";
import { PriceSummary } from "@/app/components/PriceSummary";
import { Button } from "@/app/components/Button";
import { PaymentForm } from "@/app/components/PaymentForm";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { createInspectionAndPaymentIntent } from "@/app/actions/payment";
import toast from "react-hot-toast";

const stepSchema = z.object({
  userAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the User Agreement"),
  inspectionAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the Inspection Agreement"),
});

type StepInputs = z.infer<typeof stepSchema>;

interface Props {
  onNext: () => void;
}

type PaymentPhase = "review" | "submitting" | "paying" | "redirecting";

export function StepReviewPayment({ onNext: _onNext }: Props) {
  const router = useRouter();
  const {
    vehicleInfo,
    vinInfo,
    inspectionScope,
    uploadFields,
    reviewAgreement,
    inspectionId,
    setInspectionId,
    updateReviewAgreement,
    reset,
  } = useInspectionStore(
    useShallow((s) => ({
      vehicleInfo: s.vehicleInfo,
      vinInfo: s.vinInfo,
      inspectionScope: s.inspectionScope,
      uploadFields: s.uploadFields,
      reviewAgreement: s.reviewAgreement,
      inspectionId: s.inspectionId,
      setInspectionId: s.setInspectionId,
      updateReviewAgreement: s.updateReviewAgreement,
      reset: s.reset,
    })),
  );
  const [phase, setPhase] = useState<PaymentPhase>("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      userAgreement: reviewAgreement?.userAgreement ?? false,
      inspectionAgreement: reviewAgreement?.inspectionAgreement ?? false,
    },
  });

  const startPayment = useCallback(async () => {
    setPhase("submitting");

    try {
      const formData = {
        vehicleInfo,
        vinInfo,
        inspectionScope,
        uploadFields,
        reviewAgreement,
      };

      const {
        inspectionId: createdInspectionId,
        clientSecret: nextSecret,
        paymentId: nextPaymentId,
        returnUrl: nextReturnUrl,
      } = await createInspectionAndPaymentIntent(formData);
      setInspectionId(createdInspectionId);

      setClientSecret(nextSecret);
      setPaymentId(nextPaymentId);
      setReturnUrl(nextReturnUrl);
      setPhase("paying");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start payment",
      );
      setPhase("review");
    }
  }, [
    vehicleInfo,
    vinInfo,
    inspectionScope,
    uploadFields,
    reviewAgreement,
    setInspectionId,
  ]);

  const onSubmit = (data: StepInputs) => {
    updateReviewAgreement(data);
    startPayment();
  };

  const handlePaymentSuccess = useCallback(() => {
    if (returnUrl) {
      reset();
      setPhase("redirecting");
      router.push(returnUrl);
    }
  }, [returnUrl, router, reset]);

  const handleRetry = useCallback(() => {
    setClientSecret(null);
    setReturnUrl(null);
    startPayment();
  }, [startPayment]);

  const companies = inspectionScope?.companies ?? [];

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Creating your inspection...</p>
      </div>
    );
  }

  if (phase === "paying" && clientSecret && returnUrl) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-4 ring-1 ring-inset ring-gray-100">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Complete Payment
          </h4>
          <PriceSummary companies={companies} />
        </div>
        <PaymentForm
          clientSecret={clientSecret}
          returnUrl={returnUrl}
          inspectionId={inspectionId!}
          paymentId={paymentId!}
          onSuccess={handlePaymentSuccess}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (phase === "redirecting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Redirecting to success page...</p>
      </div>
    );
  }

  return (
    <form
      id="step-7"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
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

        {inspectionScope && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">Country</p>
              <p className="text-gray-900 capitalize">
                {inspectionScope.country}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">
                {inspectionScope.country === "usa" ? "State" : "Province"}
              </p>
              <p className="text-gray-900">{inspectionScope.state}</p>
            </div>
          </div>
        )}

        <Separator className="my-4" />
        <PriceSummary companies={companies} />
      </div>

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
                  onCheckedChange={(checked) => field.onChange(checked === true)}
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
                  onCheckedChange={(checked) => field.onChange(checked === true)}
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

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" className="!w-auto !px-8">
          Proceed to Payment
        </Button>
      </div>
    </form>
  );
}
