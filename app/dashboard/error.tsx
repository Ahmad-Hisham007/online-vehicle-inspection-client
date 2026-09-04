"use client";

import ErrorState from "@/app/components/ErrorState";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <section className="flex min-h-[50vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <ErrorState
          message="Something went wrong in your dashboard. Please try again."
          reset={reset}
          homeHref="/dashboard"
          homeLabel="Back to dashboard"
        />
      </div>
    </section>
  );
}
