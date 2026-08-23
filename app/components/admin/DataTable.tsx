import { FiSearch } from "react-icons/fi";
import PaginationFooter from "./PaginationFooter";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptions?: DataTableFilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  emptyState?: ReactNode;
  loading?: boolean;
}

const CONTROL_CLASS =
  "h-[34px] border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary";

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filterOptions,
  filterValue = "",
  onFilterChange,
  page = 1,
  totalItems = rows.length,
  pageSize = 10,
  onPageChange,
  emptyState,
  loading = false,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="w-full">
      <div className="mb-4 flex w-full items-center justify-between gap-2">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn(CONTROL_CLASS, "w-56 pl-7")}
          />
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <select
            value={filterValue}
            onChange={(e) => onFilterChange?.(e.target.value)}
            aria-label="Filter"
            className={cn(CONTROL_CLASS, "w-auto")}
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[13px] font-semibold tracking-wide">
              {columns.map((col, i) => (
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
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
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

      {onPageChange && (
        <PaginationFooter
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
