import InspectionDetailSkeleton from "@/app/components/InspectionDetailSkeleton";

export default function AdminInspectionDetailLoading() {
  return (
    <section className="flex min-h-screen flex-col bg-gray-900">
      <InspectionDetailSkeleton />
    </section>
  );
}