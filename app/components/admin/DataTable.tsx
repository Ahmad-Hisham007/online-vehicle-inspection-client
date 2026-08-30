import { FiSearch } from "react-icons/fi";
import PaginationFooter from "./PaginationFooter";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { InspectionStatus } from "@/app/lib/types";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  search?: string;
  page?: number;
  status?: InspectionStatus | null;
  emptyState?: ReactNode;
  totalPages?: number;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  search = "",
  page = 1,
  status,
  totalPages = 1,
  emptyState,
}: DataTableProps<T>) {
  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[13px] font-semibold tracking-wide">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "border-r border-primary/30 px-4 py-2.5 last:border-r-0",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  {emptyState ?? (
                    <div className="text-center text-[13px] text-muted-foreground">
                      No items found.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/60"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle text-[13px] text-slate-700",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <PaginationFooter
          page={page}
          totalPages={totalPages}
          search={search}
          status={status}
          totalItems={rows.length}
          pageSize={10}
        />
      )}
    </div>
  );
}
