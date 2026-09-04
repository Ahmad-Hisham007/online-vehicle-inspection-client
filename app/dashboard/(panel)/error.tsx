"use client";

import ErrorState from "@/app/components/ErrorState";

interface PanelErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PanelError({ reset }: PanelErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <ErrorState
          message="Something went wrong loading the admin panel. Please try again."
          reset={reset}
          homeHref="/dashboard/admin/requests"
          homeLabel="Back to requests"
        />
      </div>
    </div>
  );
}
