"use client";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

export interface ImageCheckboxOption {
  value: string;
  label: string;
  imgSrc: string;
}

interface ImageCheckboxGroupProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  options: ImageCheckboxOption[];
  columns?: number;
}

export function ImageCheckboxGroup<T extends FieldValues>({
  name,
  control,
  options,
  columns = 3,
}: ImageCheckboxGroupProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? [];
        const toggleValue = (val: string) => {
          const next = selected.includes(val)
            ? selected.filter((v) => v !== val)
            : [...selected, val];
          field.onChange(next);
        };

        return (
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                "text-sm font-semibold",
                fieldState.invalid ? "text-red-500" : "text-gray-700",
              )}
            >
              Companies
            </p>
            {fieldState.error && (
              <p className="text-xs text-red-500">
                {fieldState.error.message}
              </p>
            )}
            <div
              className={cn(
                "grid gap-4 max-h-80 overflow-y-auto custom-scrollbar",
                `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
              )}
            >
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleValue(opt.value)}
                    className={cn(
                      "relative aspect-square bg-white rounded-2xl shadow-sm border-2 transition-all",
                      "flex flex-col items-center justify-center gap-2 p-4 cursor-pointer",
                      isSelected
                        ? "border-primary ring-2 ring-primary/10"
                        : "border-gray-100 hover:border-gray-300",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 size-6 bg-primary text-white rounded-full flex items-center justify-center">
                        <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                      </div>
                    )}
                    <Image
                      src={opt.imgSrc}
                      alt={opt.label}
                      width={80}
                      height={80}
                      className="object-contain"
                      style={{ width: "auto", height: "auto" }}
                    />
                    <span className="text-xs text-gray-600 font-medium">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }}
    />
  );
}
