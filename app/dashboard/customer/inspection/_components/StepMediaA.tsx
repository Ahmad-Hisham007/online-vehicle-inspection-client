"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { FileUploadField } from "@/app/components/FileUploadField";
import { FieldGroup } from "@/components/ui/field";

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
    const uploadFields = store.uploadFields;
    const allDone = fields.every((f) => uploadFields?.[f.name]?.status === "done");
    if (!allDone) {
      toast.error("Please upload all required files before proceeding");
      return;
    }
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