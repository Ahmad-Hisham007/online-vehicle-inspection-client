"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useInspectionStore } from "@/app/store/inspectionStore";
import ReInspectionVehicle from "./ReInspectionVehicle";
import ReInspectionVin from "./ReInspectionVin";
import ReInspectionReview from "./ReInspectionReview";
import { Button } from "@/app/components/Button";

import type { InspectionDetail } from "@/app/lib/types";

interface EditStepContainerProps {
  inspection: InspectionDetail;
}

// Simple step navigation helper
const TOTAL_STEPS = 7;

export default function EditStepContainer({ inspection }: EditStepContainerProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const setReInspectionMode = useInspectionStore((s) => s.setReInspectionMode);
  const prefillFromInspection = useInspectionStore((s) => s.prefillFromInspection);

  useEffect(() => {
    setReInspectionMode(inspection.id);
    prefillFromInspection({
      vehicleInfo: {
        licensePlate: inspection.licensePlate,
        mileage: parseInt(inspection.mileage, 10),
      },
      vinInfo: {
        vin: inspection.vin,
        make: inspection.make,
        model: inspection.model,
        year: parseInt(inspection.year, 10),
        fuelType: inspection.fuelType as "gasoline" | "electric" | "hybrid" | "diesel",
      },
      inspectionScope: {
        country: (inspection.location?.country || "USA").toLowerCase() as "usa" | "canada",
        state: inspection.location?.state || "",
        companies: inspection.companies || [],
        tiresOlderThan6Years: false,
        batteryOlderThan5Years: false,
        voltageGreaterThan12_1V: false,
      },
    });
  }, [inspection, setReInspectionMode, prefillFromInspection]);

  const handleNext = useCallback(() => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1)), []);
  const handleBack = useCallback(() => setStep((prev) => Math.max(prev - 1, 0)), []);

  const handleComplete = () => {
    // Navigation is handled inside ReInspectionReview after successful submission
    // Just navigate back to the inspection detail page
    router.push(`/dashboard/customer/inspection/${inspection.id}`);
  };

  const vehicleInfo = useInspectionStore((s) => s.vehicleInfo);

  // Step component render
  const renderStep = () => {
    switch(step) {
      case 0:
        return <ReInspectionVehicle onNext={handleNext} onBack={handleBack} />;
      case 1:
        return <ReInspectionVin onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <ReInspectionMediaStepA licensePlate={vehicleInfo?.licensePlate || ''} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <ReInspectionMediaStepB onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <ReInspectionMediaStepC onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <ReInspectionMediaStepD onNext={handleNext} onBack={handleBack} />;
      case 6:
        return (
          <ReInspectionReview
            inspectionId={inspection.id}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        return <ReInspectionVehicle onNext={handleNext} onBack={handleBack} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Re-inspection
          </h2>
          <div className="flex items-center text-sm text-gray-400">
            Step {step + 1} of {TOTAL_STEPS}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-lg">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// Simple media upload step - just a placeholder for now
function ReInspectionMediaStepA({ licensePlate, onNext, onBack }: { 
  licensePlate: string; 
  onNext: () => void; 
  onBack: () => void 
}) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>
      <h3 className="text-lg font-medium text-foreground">Step 3: General Photos</h3>
      <p className="text-gray-500">Media upload area for {licensePlate}</p>
      <Button onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function ReInspectionMediaStepB({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>
      <h3 className="text-lg font-medium text-foreground">Step 4: Interior Photos</h3>
      <p className="text-gray-500">Media upload area</p>
      <Button onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function ReInspectionMediaStepC({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>
      <h3 className="text-lg font-medium text-foreground">Step 5: Exterior Photos</h3>
      <p className="text-gray-500">Media upload area</p>
      <Button onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function ReInspectionMediaStepD({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>
      <h3 className="text-lg font-medium text-foreground">Step 6: Tire Photos</h3>
      <p className="text-gray-500">Media upload area</p>
      <Button onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}