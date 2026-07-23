"use client";
import { cn } from "@/lib/utils";
import { FiCheck } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex items-center min-w-max mx-auto" style={{ maxWidth: "calc(100vw - 2rem)" }}>
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 shrink-0",
                  i < currentStep && "bg-primary text-white",
                  i === currentStep &&
                    "bg-primary text-white ring-4 ring-primary/20",
                  i > currentStep && "bg-gray-200 text-gray-400",
                )}
              >
                {i < currentStep ? (
                  <FiCheck className="size-4" />
                ) : i > currentStep ? (
                  <RxCross2 className="size-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 sm:mx-3 transition-colors shrink-0",
                    i < currentStep ? "bg-primary" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Labels row */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide mt-2">
        <div className="flex min-w-max mx-auto" style={{ maxWidth: "calc(100vw - 2rem)" }}>
          {steps.map((label, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 last:flex-none text-center px-1",
              )}
            >
              <span
                className={cn(
                  "text-xs whitespace-nowrap transition-colors",
                  i <= currentStep ? "text-gray-900 font-medium" : "text-gray-400",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
