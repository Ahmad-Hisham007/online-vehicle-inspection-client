"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiFilter } from "react-icons/fi";
import { Button } from "@/app/components/Button";
import FilterInspectionsModal from "@/app/components/FilterInspectionsModal";
import { buildListHref } from "@/app/lib/listing-url";
import type { InspectionStatus, SortDir } from "@/app/lib/types";

interface InspectionToolbarProps {
  status: InspectionStatus | null;
  sortDir: SortDir;
}

export default function InspectionToolbar({
  status,
  sortDir,
}: InspectionToolbarProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-lg font-semibold text-foreground">
        Submitted Inspections
      </h1>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="primary"
          size="sm"
          className="!w-auto !px-4 !rounded-full !inline-flex"
          onClick={() => router.push("/dashboard/customer/inspection")}
        >
          <FiPlus className="size-4" />
          Add
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="!w-auto !px-4 !rounded-full !inline-flex"
          type="button"
          onClick={() => setFilterOpen(true)}
        >
          <FiFilter className="size-4" />
          Filter
        </Button>
      </div>

      {filterOpen && (
        <FilterInspectionsModal
          open
          onOpenChange={setFilterOpen}
          initialSortDir={sortDir}
          initialStatus={status}
          onSubmit={(dir, nextStatus) => {
            router.push(buildListHref({ page: 1, status: nextStatus, sortDir: dir }));
          }}
        />
      )}
    </div>
  );
}
