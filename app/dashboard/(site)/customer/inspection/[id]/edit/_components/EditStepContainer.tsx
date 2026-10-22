"use client";

import { useEffect, useState, useCallback } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { StepIndicator } from "@/app/components/StepIndicator";
import { Button } from "@/app/components/Button";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { StepVehicleSelection } from "@/app/dashboard/(site)/customer/inspection/_components/StepVehicleSelection";
import { StepVinLicense } from "@/app/dashboard/(site)/customer/inspection/_components/StepVinLicense";
import { StepMediaA } from "@/app/dashboard/(site)/customer/inspection/_components/StepMediaA";
import { StepMediaB } from "@/app/dashboard/(site)/customer/inspection/_components/StepMediaB";
import { StepMediaC } from "@/app/dashboard/(site)/customer/inspection/_components/StepMediaC";
import { StepMediaD } from "@/app/dashboard/(site)/customer/inspection/_components/StepMediaD";
import StepReInspectionReview from "./StepReInspectionReview";
import type { InspectionDetail } from "@/app/lib/types";

const STEP_LABELS = [
  "Vehicle & Selection",
  "VIN & License",
  "Media A",
  "Media B",
  "Media C",
  "Media D",
  "Review & Submit",
];

const FORM_IDS = [
  "step-1",
  "step-2",
  "step-3",
  "step-4",
  "step-5",
  "step-6",
  "step-7",
];

interface Props {
  inspection: InspectionDetail;
  inspectionId: string;
}

export default function EditStepContainer({ inspection, inspectionId }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const setReInspectionMode = useInspectionStore((s) => s.setReInspectionMode);
  const prefillFromInspection = useInspectionStore(
    (s) => s.prefillFromInspection,
  );

  useEffect(() => {
    setReInspectionMode(inspectionId);
    prefillFromInspection({
      vehicleInfo: {
        licensePlate: inspection.licensePlate,
        mileage: parseInt(inspection.mileage, 10) || 0,
      },
      vinInfo: {
        vin: inspection.vin,
        make: inspection.make,
        model: inspection.model,
        year: parseInt(inspection.year, 10) || 0,
        fuelType: inspection.fuelType as
          | "gasoline"
          | "electric"
          | "hybrid"
          | "diesel"
          | "hydrogen",
      },
      inspectionScope: {
        country: (inspection.location?.country?.toLowerCase() === "canada"
          ? "canada"
          : "usa") as "usa" | "canada",
        state: inspection.location?.state || "",
        companies: inspection.companies || [],
        tiresOlderThan6Years: inspection.tiresOlderThan6Years ?? true,
        batteryOlderThan5Years: inspection.batteryOlderThan5Years ?? true,
        voltageGreaterThan12_1V: inspection.voltageGreaterThan12_1V ?? false,
      },
    });
  }, [inspection, inspectionId, setReInspectionMode, prefillFromInspection]);

  const handleNext = useCallback(() => {
    const formId = FORM_IDS[currentStep];
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const onStepComplete = useCallback(() => {
    if (currentStep < STEP_LABELS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  return (
    <>
      <StepIndicator steps={STEP_LABELS} currentStep={currentStep} />

      <div className="flex-1 mt-6">
        {currentStep === 0 && (
          <StepVehicleSelection onNext={onStepComplete} disabled={true} />
        )}
        {currentStep === 1 && (
          <StepVinLicense onNext={onStepComplete} disabled={true} />
        )}
        {currentStep === 2 && <StepMediaA onNext={onStepComplete} />}
        {currentStep === 3 && <StepMediaB onNext={onStepComplete} />}
        {currentStep === 4 && <StepMediaC onNext={onStepComplete} />}
        {currentStep === 5 && <StepMediaD onNext={onStepComplete} />}
        {currentStep === 6 && (
          <StepReInspectionReview
            inspectionId={inspectionId}
            onBack={handleBack}
          />
        )}
      </div>

      {/* Navigation - only show for non-last steps */}
      {!isLastStep && (
        <div className="flex items-center justify-between mt-6 gap-4 shrink-0">
          {!isFirstStep ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleBack}
              type="button"
              className="!w-auto !px-6"
            >
              <FiChevronLeft className="size-5" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            onClick={handleNext}
            type="button"
            className="!w-auto !px-8"
          >
            Next
            <FiChevronRight className="size-5" />
          </Button>
        </div>
      )}
    </>
  );
}
