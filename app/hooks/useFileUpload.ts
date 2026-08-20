"use client";

import { useRef, useCallback } from "react";
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

      const attempt = async (): Promise<string> => {
        const response = await generateUploadUrl(file.type, file.size);

        const xhr = new XMLHttpRequest();

        const result = await new Promise<string>((resolve, reject) => {
          xhr.open("PUT", response.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", response.contentType);

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
            return await attempt();
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