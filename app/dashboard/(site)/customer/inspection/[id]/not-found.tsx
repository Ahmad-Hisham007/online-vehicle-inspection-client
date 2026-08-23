import Link from "next/link";
import CustomerPageShell from "@/app/components/customer/CustomerPageShell";

export default function InspectionNotFound() {
  return (
    <CustomerPageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This inspection was not found or is not accessible.
        </p>
        <Link
          href="/dashboard/customer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to inspections
        </Link>
      </div>
    </CustomerPageShell>
  );
}
