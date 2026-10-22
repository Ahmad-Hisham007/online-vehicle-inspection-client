"use client";

import { useState, useRef } from "react";
import { useInspectionStore } from "@/app/store/inspectionStore";
import { Button } from "@/app/components/Button";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { submitReInspection } from "@/app/actions/inspection";

interface Props {
  inspectionId: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function ReInspectionReview({ inspectionId, onComplete, onBack }: Props) {
  const signature = useInspectionStore((s) => s.reInspectionSignature);
  const vinInfo = useInspectionStore((s) => s.vinInfo);
  const vehicleInfo = useInspectionStore((s) => s.vehicleInfo);
  const [drawing, setDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    // Store signature in the global store
    useInspectionStore.getState().setReInspectionSignature(dataUrl);
  };

  const handleComplete = async () => {
    if (!signature) {
      toast.error("Please provide a signature");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReInspection(inspectionId, signature);
      toast.success("Re-inspection submitted!");
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back
      </button>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-inset ring-gray-100">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h4>

        {vinInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">Vehicle</p>
              <p className="text-gray-900">{vinInfo.make} {vinInfo.model} {vinInfo.year}</p>
            </div>
          </div>
        )}

        {vehicleInfo && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-primary font-medium">License Plate</p>
              <p className="text-gray-900">{vehicleInfo.licensePlate}</p>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Re-inspection Fee: $0.00 */}
        <div className="text-center py-4">
          <span className="text-2xl font-bold text-green-600">$0.00</span>
          <p className="text-sm text-gray-500">Re-inspection Fee (No payment required)</p>
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-inset ring-gray-100">
        <h4 className="text-base font-semibold text-gray-900 mb-3">Signature</h4>

        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          className="rounded-lg border border-gray-700 bg-gray-800 cursor-crosshair mx-auto"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <p className="text-xs text-gray-500 mt-1 text-center">Draw your signature above</p>

        {signature && (
          <button
            type="button"
            onClick={() => useInspectionStore.getState().setReInspectionSignature(null)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear signature
          </button>
        )}
      </div>

      <Button
        onClick={handleComplete}
        disabled={isSubmitting || !signature}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Complete Re-inspection"}
      </Button>
    </div>
  );
}