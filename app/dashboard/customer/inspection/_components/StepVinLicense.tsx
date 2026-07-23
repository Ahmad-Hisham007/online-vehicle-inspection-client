"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { FormInput } from "@/app/components/FormInput";
import { FormSelect } from "@/app/components/FormSelect";
import { FieldGroup } from "@/components/ui/field";

const CURRENT_YEAR = 2026;
const YEAR_OPTIONS: { value: string; label: string }[] = [];
for (let y = CURRENT_YEAR; y >= 1990; y--) {
  YEAR_OPTIONS.push({ value: String(y), label: String(y) });
}

const stepSchema = z.object({
  vin: z
    .string()
    .min(17, "VIN must be exactly 17 characters")
    .max(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN format"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .string()
    .min(1, "Year is required")
    .refine(
      (v) => {
        const n = Number(v);
        return !isNaN(n) && Number.isInteger(n) && n >= 1900 && n <= 2030;
      },
      { message: "Select a valid year" },
    ),
  fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid", "hydrogen"], {
    message: "Fuel type is required",
  }),
});

type StepInputs = z.infer<typeof stepSchema>;

interface Props {
  onNext: () => void;
}

export function StepVinLicense({ onNext }: Props) {
  const store = useInspectionStore();

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      vin: store.vinInfo?.vin ?? "",
      make: store.vinInfo?.make ?? "",
      model: store.vinInfo?.model ?? "",
      year: store.vinInfo?.year?.toString() ?? "",
      fuelType: (store.vinInfo?.fuelType as StepInputs["fuelType"]) ?? undefined,
    },
  });

  const onSubmit = (data: StepInputs) => {
    store.updateVinInfo({
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: Number(data.year),
      fuelType: data.fuelType,
    });
    onNext();
  };

  return (
    <form
      id="step-2"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FieldGroup className="gap-4">
        <FormInput
          name="vin"
          control={form.control}
          label="Enter VIN number"
          placeholder="17-character VIN"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormInput
            name="make"
            control={form.control}
            label="Vehicle make"
            placeholder="E.g. Toyota"
          />
          <FormInput
            name="model"
            control={form.control}
            label="Vehicle model"
            placeholder="E.g. Camry"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormSelect
            name="year"
            control={form.control}
            label="Vehicle year"
            placeholder="Select year"
            options={YEAR_OPTIONS}
          />
          <FormSelect
            name="fuelType"
            control={form.control}
            label="Fuel type"
            placeholder="Select fuel type"
            options={[
              { value: "gasoline", label: "Gasoline" },
              { value: "diesel", label: "Diesel" },
              { value: "electric", label: "Electric" },
              { value: "hybrid", label: "Hybrid" },
              { value: "hydrogen", label: "Hydrogen" },
            ]}
          />
        </div>
      </FieldGroup>
    </form>
  );
}
