"use client";

import { useInspectionStore } from "@/app/store/inspectionStore";
import { Button } from "@/app/components/Button";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function ReInspectionVehicle({ onNext, onBack }: Props) {
  const vehicleInfo = useInspectionStore((s) => s.vehicleInfo);
  const inspectionScope = useInspectionStore((s) => s.inspectionScope);

  if (!vehicleInfo || !inspectionScope) {
    return <div className="text-center p-4">Loading vehicle info...</div>;
  }

  const companies = inspectionScope.companies;
  const companyList = companies.map(c => (
    <span key={c} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mr-2 mb-1">
      {c === "uber" && "🚗 Uber"}
      {c === "lyft" && "🟊 Lyft"}
      {c === "turo" && "🚐 Turo"}
    </span>
  ));

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>

      <h3 className="text-lg font-medium text-foreground">Vehicle Information (Read-only)</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">License Plate</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {vehicleInfo.licensePlate}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mileage</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {vehicleInfo.mileage.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Country</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {inspectionScope.country === "usa" ? "USA" : "Canada"}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">State / Province</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {inspectionScope.state}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Companies</label>
        <div>{companyList}</div>
      </div>

      <Button onClick={onNext} className="w-full">
        Continue to Media Upload
      </Button>
    </div>
  );
}
