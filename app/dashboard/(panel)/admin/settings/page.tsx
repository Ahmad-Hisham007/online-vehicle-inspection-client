"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminPageShell from "@/app/components/admin/AdminPageShell";
import { FormInput } from "@/app/components/FormInput";
import { Button } from "@/app/components/Button";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .or(z.literal("")),
});

type SettingsInputs = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { control, handleSubmit } = useForm<SettingsInputs>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: SettingsInputs) => {
    void data;
  };

  return (
    <AdminPageShell title="Settings">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <FormInput
          name="name"
          control={control}
          label="Name"
          placeholder="Your name"
        />
        <FormInput
          name="email"
          control={control}
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <FormInput
          name="password"
          control={control}
          label="New Password"
          type="password"
          placeholder="Leave blank to keep current"
        />
        <Button variant="primary" size="sm" className="!w-auto !px-8 !rounded-full">
          Save Changes
        </Button>
      </form>
    </AdminPageShell>
  );
}
