"use client";
import { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FiCamera, FiEye } from "react-icons/fi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import type { FileMeta } from "@/app/store/inspectionStore";

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  value?: FileMeta;
  onChange?: (meta: FileMeta) => void;
}

export function FileUploadField({
  label,
  accept = "image/*",
  value,
  onChange,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange?.({
      name: file.name,
      size: file.size,
      status: "pending",
      progress: 0,
    });
  };

  const handleClick = () => {
    if (value?.status !== "uploading") {
      inputRef.current?.click();
    }
  };

  const status = value?.status ?? "pending";

  if (status === "done" && value) {
    return (
      <div className="flex flex-col gap-1">
        <SectionHeader label={label} />
        <div className="relative border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <div className="w-full aspect-[4/3] relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
              {value.name}
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="absolute top-3 right-3 size-8 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:bg-white shadow-sm"
            >
              <FiEye className="size-4" />
            </button>
            <div className="absolute bottom-2 right-2 size-6 bg-primary text-white rounded-full flex items-center justify-center">
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
            <span className="text-xs text-gray-500 truncate max-w-[70%]">
              {value.name}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-primary font-medium hover:underline"
            >
              Change
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  if (status === "uploading") {
    return (
      <div className="flex flex-col gap-1">
        <SectionHeader label={label} />
        <div className="relative border-2 border-primary/30 rounded-2xl bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 font-medium truncate">
                {value?.name ?? "Uploading..."}
              </p>
              <p className="text-xs text-gray-500">Uploading...</p>
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${value?.progress ?? 0}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <SectionHeader label={label} />
        <div
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-red-300 rounded-2xl bg-red-50/50 p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-red-400 transition-colors"
        >
          <p className="text-sm text-red-500 font-medium">Upload failed</p>
          <p className="text-xs text-primary font-medium hover:underline cursor-pointer">
            Tap to retry
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <SectionHeader label={label} />
      <div
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50",
          "flex flex-col items-center justify-center gap-3 p-8 min-h-48",
          "cursor-pointer hover:border-gray-400 transition-colors",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-3 right-3 size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
        >
          <FiEye className="size-4" />
        </button>

        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
          <FiCamera className="size-6 text-primary" />
        </div>

        <p className="text-sm text-gray-500 font-medium">Upload image</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  const parts = label.split(/(Photo|Video)/i);
  return (
    <h3 className="text-base font-semibold text-gray-900 mb-1">
      {parts.map((part, i) =>
        /^Photo$|^Video$/i.test(part) ? (
          <span key={i} className="text-primary">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </h3>
  );
}
