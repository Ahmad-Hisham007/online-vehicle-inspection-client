"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";

import { FormInput } from "@/app/components/FormInput";
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
  updateCurrentUser,
  updateCurrentUserPassword,
  updateUserSignature,
} from "@/app/actions/users";
import { FileUploadField } from "@/app/components/FileUploadField";
import type { CurrentUser } from "@/app/actions/users";

/**
 * Schema for the current-user settings form.
 * Differs from userEditSchema by NOT including `role` (users can't change their own role).
 */
const currentUserSettingsSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

type CurrentUserSettingsInput = z.infer<typeof currentUserSettingsSchema>;

interface CurrentUserSettingsFormProps {
  user: CurrentUser;
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function CurrentUserSettingsForm({ user }: CurrentUserSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { control, handleSubmit } = useForm<CurrentUserSettingsInput>({
    resolver: zodResolver(currentUserSettingsSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    },
  });

  const {
    control: pwControl,
    handleSubmit: handlePwSubmit,
    reset: resetPwForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: CurrentUserSettingsInput) => {
    setIsSubmitting(true);
    try {
      await updateCurrentUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? "",
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    try {
      await updateCurrentUserPassword(data.password);
      toast.success("Password updated");
      setPasswordOpen(false);
      resetPwForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignatureUpload = async (meta: { status: string; publicUrl?: string }) => {
    if (meta.status === "done" && meta.publicUrl) {
      try {
        await updateUserSignature(meta.publicUrl);
        toast.success("Signature updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save signature");
      }
    }
  };

  const handleRemoveSignature = async () => {
    try {
      await updateUserSignature("");
      toast.success("Signature removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove signature");
    }
  };

  const displayName = user.displayName ?? `${user.firstName} ${user.lastName}`.trim();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full md:max-w-120 flex-col gap-5"
    >
      {/* Header — display name + email subtitle */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Joined {user.registeredDate ? new Date(user.registeredDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormInput
            name="email"
            control={control}
            label="Email address"
            type="email"
            placeholder="you@example.com"
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

        <div className="md:col-span-2">
          <FormInput
            name="phone"
            control={control}
            label="Phone number"
            type="tel"
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      {/* Signature upload */}
      <div className="flex flex-col gap-2">
        <Field className="flex flex-col gap-1 text-sm text-left relative">
          <FieldLabel className="font-semibold text-gray-700">
            Signature (PNG)
          </FieldLabel>
          <p className="text-xs text-gray-500">
            Upload a clear PNG of your signature for certificate signing.
          </p>
        </Field>

        {user.signature && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
            <img
              src={user.signature}
              alt="Current signature"
              className="h-8 w-auto object-contain grayscale"
            />
            <button
              type="button"
              onClick={handleRemoveSignature}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        <FileUploadField
          label="Signature Photo"
          accept="image/png"
          onChange={handleSignatureUpload}
        />
      </div>

      {/* Save button */}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        className="!w-auto !rounded-full !px-8 !uppercase"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving…" : "Save Changes"}
      </Button>

      {/* Password section */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="!w-auto !rounded-full"
          onClick={() => setPasswordOpen(true)}
        >
          Update password
        </Button>
      </div>

      {/* Password dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
            <DialogDescription>
              Set a new password for {displayName || user.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="grid gap-4 py-4">
            <Field className="relative flex flex-col gap-1 text-left text-sm">
              <FieldLabel className="font-semibold text-gray-700">
                New password
              </FieldLabel>
              <div className="relative">
                <Controller
                  name="password"
                  control={pwControl}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        type={showPw ? "text" : "password"}
                        placeholder="Enter new password"
                        className="h-12 w-full rounded-md border-0 bg-white px-4 pr-10 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                      )}
                    </>
                  )}
                />
              </div>
            </Field>

            <Field className="relative flex flex-col gap-1 text-left text-sm">
              <FieldLabel className="font-semibold text-gray-700">
                Confirm password
              </FieldLabel>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={pwControl}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="h-12 w-full rounded-md border-0 bg-white px-4 pr-10 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirmPw ? "Hide password" : "Show password"}
                      >
                        {showConfirmPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                      )}
                    </>
                  )}
                />
              </div>
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPasswordOpen(false);
                  resetPwForm();
                  setShowPw(false);
                  setShowConfirmPw(false);
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
    </form>
  );
}
