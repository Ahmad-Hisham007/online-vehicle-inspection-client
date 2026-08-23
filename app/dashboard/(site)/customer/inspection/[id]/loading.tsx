import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import InspectionDetailSkeleton from "@/app/components/InspectionDetailSkeleton";

export default function InspectionDetailLoading() {
  return (
    <CustomerPageShell>
      <InspectionDetailSkeleton />
    </CustomerPageShell>
  );
}