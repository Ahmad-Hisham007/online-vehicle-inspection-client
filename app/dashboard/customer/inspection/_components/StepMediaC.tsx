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
  { name: "interiorBackSeatPhoto" as const, label: "Interior back seat Photo" },
  { name: "exteriorLeftPhoto" as const, label: "Exterior Left Photo" },
  { name: "exteriorRightPhoto" as const, label: "Exterior Right Photo" },
  { name: "exteriorFrontVideo" as const, label: "Exterior Front Video", accept: "video/*" },
  { name: "exteriorRearVideo" as const, label: "Exterior Rear Video", accept: "video/*" },
];

export function StepMediaC({ onNext }: Props) {
  const store = useInspectionStore();

  const form = useForm<StepInputs>({
    resolver: zodResolver(stepSchema),
  });

  const onSubmit = () => {
    onNext();
  };

  return (
    <form
      id="step-5"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FieldGroup className="gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <FileUploadField
              key={f.name}
              label={f.label}
              accept={f.accept}
              value={store.uploadFields?.[f.name] ?? undefined}
              onChange={(meta) => store.updateUploadField(f.name, meta)}
            />
          ))}
        </div>
      </FieldGroup>
    </form>
  );
}
