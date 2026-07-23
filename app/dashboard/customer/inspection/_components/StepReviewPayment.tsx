"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { PriceSummary } from "@/app/components/PriceSummary";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

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

export function StepReviewPayment({ onNext }: Props) {
  const store = useInspectionStore();

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      userAgreement: store.reviewAgreement?.userAgreement ?? false,
      inspectionAgreement: store.reviewAgreement?.inspectionAgreement ?? false,
    },
  });

  const onSubmit = (data: StepInputs) => {
    store.updateReviewAgreement(data);
    onNext();
  };

  const companies = store.inspectionScope?.companies ?? [];

  return (
    <form
      id="step-7"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Order Summary */}
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
    </form>
  );
}
