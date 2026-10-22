import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { fetchInspection } from "@/app/actions/inspections";
import InspectionDetailSkeleton from "@/app/components/InspectionDetailSkeleton";
import type { InspectionDetail } from "@/app/lib/types";
import EditStepContainer from "./_components/EditStepContainer";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditPageContent({ id }: { id: string }) {
  // Fetch the inspection — must be rejected
  let inspection: InspectionDetail;
  try {
    inspection = await fetchInspection(id);
  } catch {
    notFound();
  }

  // Guard: inspection must be rejected
  if (inspection.inspectionStatus !== "rejected") {
    notFound();
  }

  return <EditStepContainer inspection={inspection} inspectionId={id} />;
}

export default async function ReInspectionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <section className="bg-gray-900 min-h-screen flex flex-col overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto py-8 px-4 flex-1 flex flex-col">
        <Card size="sm" className="flex-1 flex flex-col p-4 md:p-8">
          <Suspense fallback={<InspectionDetailSkeleton />}>
            <EditPageContent id={id} />
          </Suspense>
        </Card>
      </div>
    </section>
  );
}
