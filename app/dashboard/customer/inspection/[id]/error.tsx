"use client";

import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import { Button } from "@/app/components/Button";

interface InspectionDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InspectionDetailError({
  reset,
}: InspectionDetailErrorProps) {
  return (
    <CustomerPageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this inspection.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="!w-auto !px-6"
          type="button"
          onClick={() => reset()}
        >
          Try again
        </Button>
      </div>
    </CustomerPageShell>
  );
}
