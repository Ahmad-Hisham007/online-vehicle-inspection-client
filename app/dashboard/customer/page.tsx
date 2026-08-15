"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/app/components/Button";
import InspectionCard from "@/app/components/InspectionCard";
import FilterInspectionsModal, {
  type SortDir,
} from "@/app/components/FilterInspectionsModal";
import { listInspections } from "@/app/actions/inspections";
import type { InspectionStatus, InspectionSummary } from "@/app/lib/types";

export default function CustomerDashboard() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("newest");
  const [statusFilter, setStatusFilter] = useState<InspectionStatus[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    listInspections()
      .then(setInspections)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load inspections"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    listInspections()
      .then((data) => {
        if (active) setInspections(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load inspections",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    let list = [...inspections];
    if (statusFilter.length > 0) {
      list = list.filter((i) => statusFilter.includes(i.inspectionStatus));
    }
    list.sort((a, b) => {
      const diff =
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      return sortDir === "newest" ? diff : -diff;
    });
    return list;
  }, [inspections, sortDir, statusFilter]);

  return (
    <section className="flex h-screen flex-col overflow-x-hidden bg-gray-900">
      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-4 py-8">
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <h1 className="text-lg font-semibold text-white">
            Submitted Inspections
          </h1>
          <div className="flex gap-2">
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
              Filter
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-gray-400">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="!w-auto !px-6"
                type="button"
                onClick={load}
              >
                Retry
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-sm text-gray-500">
                {inspections.length === 0
                  ? "Start by adding your first inspection"
                  : "No inspections match your filters"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visible.map((inspection) => (
                <InspectionCard key={inspection.id} inspection={inspection} />
              ))}
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <FilterInspectionsModal
          open
          onOpenChange={setFilterOpen}
          initialSortDir={sortDir}
          initialStatuses={statusFilter}
          onSubmit={(dir, statuses) => {
            setSortDir(dir);
            setStatusFilter(statuses);
          }}
        />
      )}
    </section>
  );
}