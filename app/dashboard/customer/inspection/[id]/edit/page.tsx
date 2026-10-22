import { Suspense } from "react";
import { notFound } from "next/navigation";
import InspectionDetailSkeleton from "@/app/components/InspectionDetailSkeleton";
import { fetchInspection } from "@/app/actions/inspections";
import EditStepContainer from "./_components/EditStepContainer";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ReInspectionLoader({ id }: { id: string }) {
  let inspection;
  try {
    inspection = await fetchInspection(id);
  } catch (err) {
    if (err instanceof Error && err.message === "Inspection not found") {
      notFound();
    }
    throw err;
  }

  // Guard: Only allow re-inspection for rejected inspections
  if (inspection.inspectionStatus !== "rejected") {
    notFound();
  }

  return <EditStepContainer inspection={inspection} />;
}

export default async function ReInspectionPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<InspectionDetailSkeleton />}>
      <ReInspectionLoader id={id} />
    </Suspense>
  );
}