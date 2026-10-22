"use client";

import { useInspectionStore } from "@/app/store/inspectionStore";
import { Button } from "@/app/components/Button";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function ReInspectionVin({ onNext, onBack }: Props) {
  const vinInfo = useInspectionStore((s) => s.vinInfo);

  if (!vinInfo) {
    return <div className="text-center p-4">Loading VIN info...</div>;
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>

      <h3 className="text-lg font-medium text-foreground">VIN & License Information (Read-only)</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">VIN</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-foreground break-all">
            {vinInfo.vin}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Make</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {vinInfo.make}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {vinInfo.model}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Year</label>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
            {vinInfo.year}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Fuel Type</label>
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-foreground">
          {vinInfo.fuelType === "gasoline" ? "Gasoline" :
           vinInfo.fuelType === "electric" ? "Electric" :
           vinInfo.fuelType === "hybrid" ? "Hybrid" : "Diesel"}
        </div>
      </div>

      <Button onClick={onNext} className="w-full">
        Continue to Media Upload
      </Button>
    </div>
  );
}
