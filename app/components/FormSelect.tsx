"use client";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field className="flex flex-col gap-1 text-sm text-left relative">
          <FieldLabel
            htmlFor={name}
            className={cn(
              "font-semibold",
              fieldState.invalid ? "text-red-500" : "text-gray-700",
            )}
          >
            {label}
          </FieldLabel>
          {fieldState.error && (
            <p className="text-xs text-red-500">{fieldState.error.message}</p>
          )}
          <select
            {...field}
            id={name}
            className={cn(
              "h-12 px-4 rounded-md border-0 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-100",
              "text-sm text-gray-900 placeholder:text-gray-400",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              "transition-all w-full appearance-none cursor-pointer",
              "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat",
              fieldState.invalid && "ring-red-500",
            )}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
          >
            <option value="" disabled>
              {placeholder || "Select..."}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    />
  );
}
