import { notFound } from "next/navigation";
import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import InspectionDetailView from "@/app/components/InspectionDetailView/InspectionDetailView";
import { fetchInspection } from "@/app/actions/inspections";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerInspectionDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

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
    <CustomerPageShell>
      <InspectionDetailView inspection={inspection} role="customer" />
    </CustomerPageShell>
  );
}
