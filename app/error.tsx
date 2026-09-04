"use client";

import ErrorState from "@/app/components/ErrorState";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ reset }: RootErrorProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <ErrorState
          message="Something went wrong loading this page. Please try again."
          reset={reset}
          homeHref="/"
          homeLabel="Back to home"
        />
      </div>
    </section>
  );
}
