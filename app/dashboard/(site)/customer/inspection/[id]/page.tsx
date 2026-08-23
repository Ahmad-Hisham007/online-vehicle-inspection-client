import { Suspense } from "react";
import { notFound } from "next/navigation";
import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import InspectionDetailView from "@/app/components/InspectionDetailView/InspectionDetailView";
import InspectionDetailSkeleton from "@/app/components/InspectionDetailSkeleton";
import { fetchInspection } from "@/app/actions/inspections";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function InspectionDetailLoader({ id }: { id: string }) {
  let inspection;
  try {
    inspection = await fetchInspection(id);
  } catch (err) {
    if (err instanceof Error && err.message === "Inspection not found") {
      notFound();
    }
    throw err;
  }

  return <InspectionDetailView inspection={inspection} role="customer" />;
}

export default async function CustomerInspectionDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <CustomerPageShell>
      <Suspense fallback={<InspectionDetailSkeleton />}>
        <InspectionDetailLoader id={id} />
      </Suspense>
    </CustomerPageShell>
  );
}