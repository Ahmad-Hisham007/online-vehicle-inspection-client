"use client";

import { useRef, useCallback } from "react";
import { uploadFile } from "@uploadcare/upload-client";
import { generateUploadUrl } from "@/app/actions/upload";

export interface UseFileUploadOptions {
  maxRetries?: number;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const maxRetries = options?.maxRetries ?? 3;
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    (
      file: File,
      onProgress?: (percent: number) => void,
    ): Promise<string> => {
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      const attempt = async (retriesLeft: number): Promise<string> => {
        const response = await generateUploadUrl(file.type, file.size);

        if (response.uploadUrl === "uploadcare") {
          const result = await uploadFile(file, {
            publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY!,
            store: "auto",
            signal,
            onProgress: (info) => {
              if (info.isComputable) {
                onProgress?.(Math.round(info.value * 100));
              }
            },
          });
          return result.cdnUrl;
        }

        const xhr = new XMLHttpRequest();

        const result = await new Promise<string>((resolve, reject) => {
          xhr.open("PUT", response.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              onProgress?.(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response.publicUrl);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload cancelled"));

          signal.addEventListener("abort", () => xhr.abort(), { once: true });

          xhr.send(file);
        });

        return result;
      };

      const uploadWithRetry = async (): Promise<string> => {
        let lastError: Error | null = null;

        for (let attemptCount = 0; attemptCount <= maxRetries; attemptCount++) {
          try {
            return await attempt(maxRetries - attemptCount);
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (signal.aborted) throw lastError;
          }
        }

        throw lastError ?? new Error("Upload failed after retries");
      };

      return uploadWithRetry();
    },
    [maxRetries],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { upload, cancel };
}
