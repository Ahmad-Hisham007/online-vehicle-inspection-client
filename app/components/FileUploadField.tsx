"use client";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { FiCamera, FiVideo } from "react-icons/fi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import type { FileMeta } from "@/app/store/inspectionStore";

const ACCEPTED_IMAGE_TYPES =
  ".jpg,.jpeg,.png,.heic,.webp,.bmp,.tiff,image/jpeg,image/png,image/heic,image/webp,image/bmp,image/tiff";
const ACCEPTED_VIDEO_TYPES =
  ".mp4,.mov,.avi,.webm,video/mp4,video/quicktime,video/x-msvideo,video/webm";

const MAX_FILE_SIZE = {
  image: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

function isImageAccept(accept: string): boolean {
  return accept.includes("image") || ACCEPTED_IMAGE_TYPES.split(",").some((t) => accept.includes(t));
}

function matchesAcceptedType(file: File, accept: string): boolean {
  if (!accept || accept === "*/*") return true;
  const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return allowed.some((a) => file.type.match(a) || ext === a);
}

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
  const [isDragOver, setIsDragOver] = useState(false);
  const { upload, cancel } = useFileUpload();

  const currentFileRef = useRef<File | null>(null);

  const startUpload = useCallback(
    (file: File) => {
      currentFileRef.current = file;

      onChange?.({
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0,
      });

      upload(file, (percent) => {
        onChange?.({
          name: file.name,
          size: file.size,
          status: "uploading",
          progress: percent,
        });
      })
        .then((publicUrl) => {
          onChange?.({
            name: file.name,
            size: file.size,
            status: "done",
            progress: 100,
            publicUrl,
          });
        })
        .catch(() => {
          onChange?.({
            name: file.name,
            size: file.size,
            status: "error",
            progress: 0,
          });
        });
    },
    [onChange, upload],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(file);
  };

  const handleClick = () => {
    if (value?.status !== "uploading") {
      inputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!matchesAcceptedType(file, accept)) {
      return;
    }
    startUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRetry = () => {
    if (currentFileRef.current) {
      startUpload(currentFileRef.current);
    } else {
      inputRef.current?.click();
    }
  };

  const handleCancel = () => {
    cancel();
    onChange?.({
      name: value?.name ?? "",
      size: value?.size,
      status: "pending",
      progress: 0,
    });
  };

  const isPhoto = isImageAccept(accept);
  const status = value?.status ?? "pending";

  if (status === "done" && value) {
    return (
      <div className="flex flex-col gap-1">
        <SectionHeader label={label} />
        <div className="border border-green-200 rounded-xl bg-green-50/30 p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {isPhoto ? (
                <FiCamera className="size-5 text-primary" />
              ) : (
                <FiVideo className="size-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 font-medium truncate">
                {value.name}
              </p>
              <p className="text-xs text-green-600 font-medium">Uploaded</p>
            </div>
            <div className="size-7 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Tick02Icon} className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
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
        <div className="border-2 border-primary/30 rounded-xl bg-primary/5 p-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 font-medium truncate">
                {value?.name ?? "Uploading..."}
              </p>
              <p className="text-xs text-gray-500">
                {value?.progress ?? 0}%
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0"
            >
              Cancel
            </button>
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
        <div className="border-2 border-dashed border-red-300 rounded-xl bg-red-50/50 p-5 flex flex-col items-center gap-2">
          <p className="text-sm text-red-500 font-medium">Upload failed</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs text-primary font-medium hover:underline"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-gray-500 font-medium hover:underline"
            >
              Choose different file
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

  return (
    <div className="flex flex-col gap-1">
      <SectionHeader label={label} />
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl bg-gray-50/50",
          "flex flex-col items-center justify-center gap-2 p-6 min-h-36",
          "cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
        )}
      >
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
          {isPhoto ? (
            <FiCamera className="size-5 text-primary" />
          ) : (
            <FiVideo className="size-5 text-primary" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">
            {isDragOver ? "Drop file here" : isPhoto ? "Upload image" : "Upload video"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPhoto ? "JPG, PNG, HEIC, WebP" : "MP4, MOV, AVI"}
          </p>
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

function SectionHeader({ label }: { label: string }) {
  const parts = label.split(/(Photo|Video)/i);
  return (
    <h3 className="text-sm font-semibold text-gray-900">
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