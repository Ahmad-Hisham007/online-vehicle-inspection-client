"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { FormInput } from "@/app/components/FormInput";
import { FormSelect } from "@/app/components/FormSelect";
import { ImageCheckboxGroup } from "@/app/components/ImageCheckboxGroup";
import { PriceSummary } from "@/app/components/PriceSummary";
import { FieldGroup } from "@/components/ui/field";
import { getStates, getCompanies } from "@/app/lib/constants";

const stepSchema = z
  .object({
    licensePlate: z
      .string()
      .min(1, "License plate is required")
      .regex(/^[A-Z0-9 -]{1,10}$/, "Invalid license plate format"),
    mileage: z
      .number({ message: "Mileage is required" })
      .int("Mileage must be a whole number")
      .positive("Mileage must be positive"),
    country: z.enum(["usa", "canada"], { message: "Country is required" }),
    state: z.string().min(1, "State/Province is required"),
    companies: z.array(z.string()).min(1, "Select at least one company"),
    tiresOlderThan6Years: z
      .boolean()
      .refine((v) => v === true, {
        message: "Manufacture date must be less than 6 years to proceed",
      }),
    batteryOlderThan5Years: z.boolean().optional(),
    voltageGreaterThan12_1V: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.companies.includes("turo")) {
      if (data.batteryOlderThan5Years === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "This field is required when Turo is selected",
          path: ["batteryOlderThan5Years"],
        });
      }
      if (data.batteryOlderThan5Years === false && data.voltageGreaterThan12_1V !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Voltage must be greater than 12.1V to proceed",
          path: ["voltageGreaterThan12_1V"],
        });
      }
    }
  });

type StepInputs = z.infer<typeof stepSchema>;
export type { StepInputs };
export { stepSchema };

interface Props {
  onNext: () => void;
}

export function StepVehicleSelection({ onNext }: Props) {
  const store = useInspectionStore();
  const scope = store.inspectionScope;

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      licensePlate: store.vehicleInfo?.licensePlate ?? "",
      mileage: store.vehicleInfo?.mileage ?? ("" as unknown as number),
      country: (scope?.country as StepInputs["country"]) ?? undefined,
      state: scope?.state ?? "",
      companies: scope?.companies ?? [],
      tiresOlderThan6Years: scope?.tiresOlderThan6Years ?? undefined,
      batteryOlderThan5Years: scope?.batteryOlderThan5Years ?? undefined,
      voltageGreaterThan12_1V: scope?.voltageGreaterThan12_1V ?? undefined,
    },
  });

  const watchedCountry = form.watch("country");
  const watchedCompanies = form.watch("companies");

  const onSubmit = (data: StepInputs) => {
    store.updateVehicleInfo({
      licensePlate: data.licensePlate,
      mileage: data.mileage,
    });
    store.updateInspectionScope({
      country: data.country,
      state: data.state,
      companies: data.companies,
      tiresOlderThan6Years: data.tiresOlderThan6Years,
      batteryOlderThan5Years: data.batteryOlderThan5Years,
      voltageGreaterThan12_1V: data.voltageGreaterThan12_1V,
    });
    onNext();
  };

  const companies = watchedCountry ? getCompanies(watchedCountry) : [];

  const companyOptions = companies.map((c) => ({
    value: c.value,
    label: c.label,
    imgSrc: `/company-logos/${c.value}.${c.ext}`,
  }));

  return (
    <form
      id="step-1"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FieldGroup className="gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormInput
            name="licensePlate"
            control={form.control}
            label="Enter license plate"
            placeholder="E.g. ABC123"
          />
          <FormInput
            name="mileage"
            control={form.control}
            label="Mileage"
            placeholder="E.g. 50000"
            type="number"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormSelect
            name="country"
            control={form.control}
            label="Country"
            placeholder="Select country"
            options={[
              { value: "usa", label: "USA" },
              { value: "canada", label: "Canada" },
            ]}
          />
          {watchedCountry && (
            <FormSelect
              name="state"
              control={form.control}
              label={watchedCountry === "usa" ? "State" : "Province"}
              placeholder={
                watchedCountry === "usa" ? "Select state" : "Select province"
              }
              options={getStates(watchedCountry)}
            />
          )}
        </div>

        {watchedCountry && (
          <ImageCheckboxGroup
            name="companies"
            control={form.control}
            options={companyOptions}
            columns={3}
          />
        )}

        {watchedCompanies.includes("turo") && (
          <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl ring-1 ring-inset ring-gray-100">
            <p className="text-sm font-semibold text-primary">
              Turo Additional Questions
            </p>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Is the manufacture date for the tires less than 6 years old?
              </p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.watch("tiresOlderThan6Years") === true}
                    onChange={() =>
                      form.setValue("tiresOlderThan6Years", true)
                    }
                    className="accent-primary size-4"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.watch("tiresOlderThan6Years") === false}
                    onChange={() =>
                      form.setValue("tiresOlderThan6Years", false)
                    }
                    className="accent-primary size-4"
                  />
                  No
                </label>
              </div>
              {form.formState.errors.tiresOlderThan6Years && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.tiresOlderThan6Years.message}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Is the battery less than 5 years old?
              </p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.watch("batteryOlderThan5Years") === true}
                    onChange={() => {
                      form.setValue("batteryOlderThan5Years", true);
                      form.clearErrors("batteryOlderThan5Years");
                      form.setValue("voltageGreaterThan12_1V", undefined);
                      form.clearErrors("voltageGreaterThan12_1V");
                    }}
                    className="accent-primary size-4"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.watch("batteryOlderThan5Years") === false}
                    onChange={() => {
                      form.setValue("batteryOlderThan5Years", false);
                      form.clearErrors("batteryOlderThan5Years");
                    }}
                    className="accent-primary size-4"
                  />
                  No
                </label>
              </div>
              {form.formState.errors.batteryOlderThan5Years && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.batteryOlderThan5Years.message}
                </p>
              )}
            </div>

            {form.watch("batteryOlderThan5Years") === false && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Is the Voltage greater than 12.1V?
                </p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.watch("voltageGreaterThan12_1V") === true}
                      onChange={() =>
                        form.setValue("voltageGreaterThan12_1V", true)
                      }
                      className="accent-primary size-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.watch("voltageGreaterThan12_1V") === false}
                      onChange={() =>
                        form.setValue("voltageGreaterThan12_1V", false)
                      }
                      className="accent-primary size-4"
                    />
                    No
                  </label>
                </div>
                {form.formState.errors.voltageGreaterThan12_1V && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.voltageGreaterThan12_1V.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <PriceSummary companies={form.watch("companies")} />
      </FieldGroup>
    </form>
  );
}
