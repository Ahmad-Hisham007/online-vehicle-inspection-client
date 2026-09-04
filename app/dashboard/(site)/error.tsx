"use client";

import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import ErrorState from "@/app/components/ErrorState";

interface SiteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SiteError({ reset }: SiteErrorProps) {
  return (
    <CustomerPageShell>
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <ErrorState
          message="Something went wrong loading this page. Please try again."
          reset={reset}
          homeHref="/dashboard"
          homeLabel="Back to dashboard"
        />
      </div>
    </CustomerPageShell>
  );
}
