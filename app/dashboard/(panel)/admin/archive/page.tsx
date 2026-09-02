import { ArchiveListing } from "@/app/components/admin/ArchiveListing";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    certificate?: string;
  }>;
}
export default function ArchivePage({ searchParams }: PageProps) {
  return <ArchiveListing searchParams={searchParams} />;
}
