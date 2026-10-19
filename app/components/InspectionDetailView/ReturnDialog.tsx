"use client";
import { returnInspection } from "@/app/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../Button";
interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  inspectionAuthorId?: string;
}
const ReturnDialog = ({
  open,
  onOpenChange,
  inspectionId,
  inspectionAuthorId,
}: ReturnDialogProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await returnInspection(inspectionId, inspectionAuthorId);
      toast.success("Inspection returned");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to return inspection",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-primary sm:text-center">
            Return inspection
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            Are you sure you want to return this inspection? This action will
            turn it back in progress.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!w-auto !px-8"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="!w-auto !px-8"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Returning…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDialog;
