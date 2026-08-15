"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/app/components/Button";
import { INSPECTION_STATUSES } from "@/app/lib/types";
import type { InspectionStatus } from "@/app/lib/types";
import { getStatusLabel } from "@/app/lib/status";

export type SortDir = "newest" | "oldest";

interface FilterInspectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSortDir: SortDir;
  initialStatuses: InspectionStatus[];
  onSubmit: (sortDir: SortDir, statuses: InspectionStatus[]) => void;
}

export default function FilterInspectionsModal({
  open,
  onOpenChange,
  initialSortDir,
  initialStatuses,
  onSubmit,
}: FilterInspectionsModalProps) {
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);
  const [statuses, setStatuses] = useState<InspectionStatus[]>(initialStatuses);

  const toggleStatus = (status: InspectionStatus) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleSubmit = () => {
    onSubmit(sortDir, statuses);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-primary sm:text-center">
            Filter inspections
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2.5 text-sm font-medium text-muted-foreground">By Date</p>
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 text-sm text-foreground">
                <input
                  type="radio"
                  name="sortDir"
                  value="newest"
                  checked={sortDir === "newest"}
                  onChange={() => setSortDir("newest")}
                  className="accent-primary size-4"
                />
                Newest
              </label>
              <label className="flex items-center gap-2.5 text-sm text-foreground">
                <input
                  type="radio"
                  name="sortDir"
                  value="oldest"
                  checked={sortDir === "oldest"}
                  onChange={() => setSortDir("oldest")}
                  className="accent-primary size-4"
                />
                Oldest
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-sm font-medium text-muted-foreground">By status</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {INSPECTION_STATUSES.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2.5 text-sm text-foreground"
                >
                  <Checkbox
                    checked={statuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  {getStatusLabel(status)}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="!w-auto !px-10"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}