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
    <div>
      <div className="p-4">
        <h1 className="mb-4 text-center text-xl font-bold text-foreground">
          Car details
        </h1>
        <div className="space-y-4">
          <InspectionHeader inspection={inspection} />
          <SpecificationsBlock inspection={inspection} />
          <SelectedCompanies companies={inspection.companies} />
          <MediaGallery media={inspection.media} />
        </div>
      </div>

      <div className="sticky bottom-0 rounded-t-2xl border-t border-border bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <CertificatesPanel inspection={inspection} role={role} />
      </div>
    </div>
  );
}
