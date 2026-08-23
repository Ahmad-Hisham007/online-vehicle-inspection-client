import InspectionListing from "@/app/components/customer/InspectionListing";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; sort?: string }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: PageProps) {
  return <InspectionListing searchParams={searchParams} />;
}
