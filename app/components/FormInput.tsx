// components/FormInput.tsx
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

interface FormInputProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  type?: string;
  children?: string | React.ReactNode;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = "text",
  children,
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field className="flex flex-col gap-2 mb-4 text-left relative">
          <FieldLabel
            htmlFor={name}
            className={`font-semibold ${fieldState.invalid ? "text-red-500" : "text-gray-700"}`}
          >
            {label}
          </FieldLabel>
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            className={`h-12 px-4 rounded-md border-0 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:text-sm transition-all w-full ${
              fieldState.invalid ? "ring-red-500" : ""
            }`}
          />
          {children}
          {fieldState.error && (
            <p className="text-xs text-red-500 mt-1">
              {fieldState.error.message}
            </p>
          )}
        </Field>
      )}
    />
  );
}
