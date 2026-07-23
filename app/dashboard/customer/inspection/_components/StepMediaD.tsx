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
  { name: "leftFrontTirePhoto" as const, label: "Left front tire Photo" },
  { name: "rightFrontTirePhoto" as const, label: "Right front tire Photo" },
  { name: "leftRearTirePhoto" as const, label: "Left rear tire Photo" },
  { name: "rightRearTirePhoto" as const, label: "Right rear tire Photo" },
];

export function StepMediaD({ onNext }: Props) {
  const store = useInspectionStore();

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
  });

  const onSubmit = () => {
    onNext();
  };

  return (
    <form
      id="step-6"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FieldGroup className="gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <FileUploadField
              key={f.name}
              label={f.label}
              value={store.uploadFields?.[f.name] ?? undefined}
              onChange={(meta) => store.updateUploadField(f.name, meta)}
            />
          ))}
        </div>
      </FieldGroup>
    </form>
  );
}
