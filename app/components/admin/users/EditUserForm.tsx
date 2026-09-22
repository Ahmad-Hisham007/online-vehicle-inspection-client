"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "zod";

import AdminPageShell from "@/app/components/admin/AdminPageShell";
import { FormInput } from "@/app/components/FormInput";
import { FormSelect } from "@/app/components/FormSelect";
import { Button } from "@/app/components/Button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  USER_ROLES,
  userEditSchema,
  type UserEditInput,
} from "@/app/lib/schemas/userEdit";
import { updateUser, updateUserPassword } from "@/app/actions/users";
import type { AdminUserDetail } from "@/app/lib/types";

const ROLE_OPTIONS = [
  { value: "subscriber", label: "Customer" },
  { value: "inspector", label: "Inspector" },
  { value: "administrator", label: "Administrator" },
].filter((opt): opt is { value: string; label: string } =>
  USER_ROLES.includes(opt.value as (typeof USER_ROLES)[number]),
);

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

function formatJoined(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface EditUserFormProps {
  user: AdminUserDetail;
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { control, handleSubmit } = useForm<UserEditInput>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role:
        (user.role as UserEditInput["role"]) ??
        ("customer" as UserEditInput["role"]),
    },
  });

  const {
    control: pwControl,
    handleSubmit: handlePwSubmit,
    reset: resetPwForm,
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: UserEditInput) => {
    setIsSubmitting(true);
    try {
      await updateUser(user.id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phoneNumber: data.phone,
      });
      toast.success("User updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordInput) => {
    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(user.id, data.password);
      toast.success("Password updated");
      setPasswordOpen(false);
      resetPwForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AdminPageShell title="Edit user">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full md:max-w-120 flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              name="email"
              control={control}
              label="Email address"
              type="email"
              placeholder="user@example.com"
            />
          </div>

          <FormInput
            name="firstName"
            control={control}
            label="First name"
            placeholder="First name"
          />
          <FormInput
            name="lastName"
            control={control}
            label="Last name"
            placeholder="Last name"
          />

          <FormInput
            name="phone"
            control={control}
            label="Phone number"
            type="tel"
            placeholder="(555) 555-5555"
          />
          <FormSelect
            name="role"
            control={control}
            label="Role"
            placeholder="Select role"
            options={ROLE_OPTIONS}
          />

          <div className="md:col-span-2">
            <Field className="relative flex flex-col gap-1 text-left text-sm">
              <FieldLabel className="font-semibold text-gray-700">
                Date joined
              </FieldLabel>
              <Input
                value={formatJoined(user.registeredDate)}
                readOnly
                disabled
                className="h-12 w-full cursor-not-allowed rounded-md border-0 bg-gray-100 px-4 text-sm text-gray-500 shadow-sm ring-1 ring-inset ring-gray-100"
              />
            </Field>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="!w-auto !rounded-full !px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating…" : "Update"}
        </Button>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* TODO(task 6.3): make functional — block/unblock the user */}
          <Button type="button" variant="secondary" size="sm">
            Block
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPasswordOpen(true)}
          >
            Update password
          </Button>
        </div>
      </form>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (!open) resetPwForm();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
            <DialogDescription>
              Set a new password for {user.firstName || user.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="grid gap-4 py-4">
            <FormInput
              name="password"
              control={pwControl}
              label="New password"
              type="password"
              placeholder="Enter new password"
            />
            <FormInput
              name="confirmPassword"
              control={pwControl}
              label="Confirm password"
              type="password"
              placeholder="Confirm new password"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPasswordOpen(false);
                  resetPwForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
