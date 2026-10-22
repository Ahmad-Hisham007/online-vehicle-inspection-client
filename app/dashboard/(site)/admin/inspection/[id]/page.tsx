import { Suspense } from "react";
import { notFound } from "next/navigation";
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

  return (
    <section className="flex min-h-screen flex-col bg-gray-900">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-clip rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-sm">
          <InspectionDetailView inspection={inspection} role="admin" />
        </div>
      </div>
    </section>
  );
}

export default async function AdminInspectionDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  // This page is a Server Component - data is fetched server-side
  // Mutations (approve/reject/return) call revalidateTag/revalidatePath
  // which triggers a re-render of this page when the cache is invalidated
  return (
    <Suspense fallback={<InspectionDetailSkeleton />}>
      <InspectionDetailLoader id={id} />
    </Suspense>
  );
}