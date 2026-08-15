import InspectionHeader from "@/app/components/InspectionDetailView/InspectionHeader";
import SpecificationsBlock from "@/app/components/InspectionDetailView/SpecificationsBlock";
import SelectedCompanies from "@/app/components/InspectionDetailView/SelectedCompanies";
import MediaGallery from "@/app/components/InspectionDetailView/MediaGallery";
import CertificatesPanel from "@/app/components/InspectionDetailView/CertificatesPanel";
import type { InspectionDetail } from "@/app/lib/types";

interface InspectionDetailViewProps {
  inspection: InspectionDetail;
  role: "customer" | "admin";
}

export default function InspectionDetailView({
  inspection,
  role,
}: InspectionDetailViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="mb-6 text-center text-xl font-bold text-foreground">
        Car details
      </h1>

      <InspectionHeader inspection={inspection} />
      <SpecificationsBlock inspection={inspection} />
      <SelectedCompanies companies={inspection.companies} />
      <MediaGallery media={inspection.media} />
      <CertificatesPanel inspection={inspection} role={role} />
    </div>
  );
}