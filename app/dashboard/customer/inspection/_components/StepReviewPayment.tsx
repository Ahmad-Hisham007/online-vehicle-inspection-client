"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { PriceSummary } from "@/app/components/PriceSummary";
import { Button } from "@/app/components/Button";
import { PaymentForm } from "@/app/components/PaymentForm";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { createInspectionDraft } from "@/app/actions/inspection";
import { createPaymentIntent } from "@/app/actions/payment";
import { calculatePrice } from "@/app/lib/constants";
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
  const store = useInspectionStore();
  const [phase, setPhase] = useState<PaymentPhase>("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      userAgreement: store.reviewAgreement?.userAgreement ?? false,
      inspectionAgreement: store.reviewAgreement?.inspectionAgreement ?? false,
    },
  });

  const startPayment = useCallback(async () => {
    setPhase("submitting");

    try {
      const companies = store.inspectionScope?.companies ?? [];
      const price = calculatePrice(companies);
      const amountCents = price.total * 100;

      const formData = {
        vehicleInfo: store.vehicleInfo,
        vinInfo: store.vinInfo,
        inspectionScope: store.inspectionScope,
        uploadFields: store.uploadFields,
        reviewAgreement: store.reviewAgreement,
      };

      const { inspectionId } = await createInspectionDraft(formData);
      store.setInspectionId(inspectionId);

      const result = await createPaymentIntent(inspectionId, amountCents);
      setClientSecret(result.clientSecret);
      setPaymentId(result.paymentId);
      setReturnUrl(result.returnUrl);
      setPhase("paying");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start payment",
      );
      setPhase("review");
    }
  }, [store]);

  const onSubmit = (data: StepInputs) => {
    store.updateReviewAgreement(data);
    startPayment();
  };

  const handlePaymentSuccess = useCallback(() => {
    if (returnUrl) {
      store.reset();
      setPhase("redirecting");
      router.push(returnUrl);
    }
  }, [returnUrl, router, store]);

  const handleRetry = useCallback(() => {
    setClientSecret(null);
    setReturnUrl(null);
    startPayment();
  }, [startPayment]);

  const companies = store.inspectionScope?.companies ?? [];

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
          inspectionId={store.inspectionId!}
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

        {store.vinInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">Vehicle</p>
              <p className="text-gray-900">
                {store.vinInfo.make} {store.vinInfo.model} {store.vinInfo.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">Fuel Type</p>
              <p className="text-gray-900 capitalize">
                {store.vinInfo.fuelType}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">VIN</p>
              <p className="text-gray-900 font-mono text-xs">
                {store.vinInfo.vin}
              </p>
            </div>
            {store.vehicleInfo?.mileage && (
              <div>
                <p className="text-xs text-primary font-medium">Mileage</p>
                <p className="text-gray-900">
                  {store.vehicleInfo.mileage.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {store.vehicleInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">License Plate</p>
              <p className="text-gray-900">{store.vehicleInfo.licensePlate}</p>
            </div>
          </div>
        )}

        {store.inspectionScope && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">Country</p>
              <p className="text-gray-900 capitalize">
                {store.inspectionScope.country}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">
                {store.inspectionScope.country === "usa" ? "State" : "Province"}
              </p>
              <p className="text-gray-900">{store.inspectionScope.state}</p>
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
