import InspectionCard from "@/app/components/InspectionCard";
import InspectionPagination from "./InspectionPagination";
import { listInspections } from "@/app/actions/inspections";
import type { InspectionStatus, SortDir } from "@/app/lib/types";

interface CustomerInspectionListProps {
  page: number;
  status: InspectionStatus | null;
  sortDir: SortDir;
}

export default async function CustomerInspectionList({
  page,
  status,
  sortDir,
}: CustomerInspectionListProps) {
  const data = await listInspections({ page, perPage: 8, status, sortDir });

  const hasFilter = Boolean(status) || page > 1 || sortDir !== "newest";

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground">
              {hasFilter
                ? "No inspections match your filters"
                : "Start by adding your first inspection"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.items.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="shrink-0 border-t border-border p-3">
          <InspectionPagination
            page={data.page}
            totalPages={data.totalPages}
            status={status}
            sortDir={sortDir}
          />
        </div>
      )}
    </div>
  );
}
