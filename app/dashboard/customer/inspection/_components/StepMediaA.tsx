"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { FileUploadField } from "@/app/components/FileUploadField";
import { FieldGroup } from "@/components/ui/field";

// TODO Phase 3: Add required file validation per field once upload engine is wired
const stepSchema = z.object({});

type StepInputs = z.infer<typeof stepSchema>;

interface Props {
  onNext: () => void;
}

const fields = [
  { name: "registrationCardPhoto" as const, label: "Registration card Photo" },
  { name: "odometerPhoto" as const, label: "Odometer Photo" },
  { name: "hornVideo" as const, label: "Horn Video", accept: "video/*" },
];

export function StepMediaA({ onNext }: Props) {
  const store = useInspectionStore();

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
  });

  const onSubmit = () => {
    onNext();
  };

  return (
    <form
      id="step-3"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FieldGroup className="gap-6">
        {fields.map((f) => (
          <FileUploadField
            key={f.name}
            label={f.label}
            accept={f.accept}
            value={store.uploadFields?.[f.name] ?? undefined}
            onChange={(meta) => store.updateUploadField(f.name, meta)}
          />
        ))}
      </FieldGroup>
    </form>
  );
}
