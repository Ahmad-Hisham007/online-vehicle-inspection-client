import { RequestsListing } from "@/app/components/admin/RequestsListing";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}
export default function RequestsPage({ searchParams }: PageProps) {
  return <RequestsListing searchParams={searchParams} />;
}
