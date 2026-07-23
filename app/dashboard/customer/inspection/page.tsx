"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/app/components/Button";
import { StepIndicator } from "@/app/components/StepIndicator";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { StepVehicleSelection } from "./_components/StepVehicleSelection";
import { StepVinLicense } from "./_components/StepVinLicense";
import { StepMediaA } from "./_components/StepMediaA";
import { StepMediaB } from "./_components/StepMediaB";
import { StepMediaC } from "./_components/StepMediaC";
import { StepMediaD } from "./_components/StepMediaD";
import { StepReviewPayment } from "./_components/StepReviewPayment";

const STEP_LABELS = [
  "Vehicle & Selection",
  "VIN & License",
  "Media A",
  "Media B",
  "Media C",
  "Media D",
  "Review & Payment",
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

export default function InspectionPage() {
  const currentStep = useInspectionStore((s) => s.currentStep);
  const setStep = useInspectionStore((s) => s.setStep);

  const handleNext = () => {
    const formId = FORM_IDS[currentStep];
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const onStepComplete = () => {
    if (currentStep < STEP_LABELS.length - 1) {
      setStep(currentStep + 1);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  return (
    <section className="bg-gray-900 min-h-screen flex flex-col overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto py-8 px-4 flex-1 flex flex-col">
      <Card size="sm" className="flex-1 flex flex-col p-4 md:p-8">
        <StepIndicator steps={STEP_LABELS} currentStep={currentStep} />

        <div className="flex-1 mt-6">
          {currentStep === 0 && <StepVehicleSelection onNext={onStepComplete} />}
          {currentStep === 1 && <StepVinLicense onNext={onStepComplete} />}
          {currentStep === 2 && <StepMediaA onNext={onStepComplete} />}
          {currentStep === 3 && <StepMediaB onNext={onStepComplete} />}
          {currentStep === 4 && <StepMediaC onNext={onStepComplete} />}
          {currentStep === 5 && <StepMediaD onNext={onStepComplete} />}
          {currentStep === 6 && <StepReviewPayment onNext={onStepComplete} />}
        </div>

        {/* Navigation */}
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
            {isLastStep ? "Proceed to Payment" : "Next"}
            {!isLastStep && <FiChevronRight className="size-5" />}
          </Button>
        </div>
      </Card>
      </div>
    </section>
  );
}
