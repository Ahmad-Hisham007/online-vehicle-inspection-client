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
                "grid gap-3 max-h-72 overflow-y-auto thin-scrollbar grid-cols-2",
                columns === 3 && "lg:grid-cols-3",
                columns === 4 && "lg:grid-cols-4",
                columns === 2 && "lg:grid-cols-2",
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
                      "relative bg-white rounded-xl shadow-sm border-2 transition-all",
                      "flex flex-col items-center justify-center gap-1.5 p-2 min-h-[80px] cursor-pointer",
                      isSelected
                        ? "border-primary ring-2 ring-primary/10"
                        : "border-gray-100 hover:border-gray-300",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 size-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                      </div>
                    )}
                    <div className="flex items-center justify-center size-10">
                      <Image
                        src={opt.imgSrc}
                        alt={opt.label}
                        width={40}
                        height={40}
                        className="object-contain max-h-full max-w-full"
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium leading-tight text-center">
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