"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/app/components/Button";
import { rejectInspection } from "@/app/actions/admin";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
}

export default function RejectDialog({
  open,
  onOpenChange,
  inspectionId,
}: RejectDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await rejectInspection(inspectionId);
      toast.success("Inspection rejected");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject inspection",
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
            Reject inspection
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            Are you sure you want to reject this inspection? This action will
            mark it as rejected.
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
            {isSubmitting ? "Rejecting…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}