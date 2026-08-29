import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildListHref } from "@/app/lib/listing-url";
import type { InspectionStatus, SortDir } from "@/app/lib/types";

interface InspectionPaginationProps {
  page: number;
  totalPages: number;
  status?: InspectionStatus | null;
  sortDir?: SortDir;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}
// [1, "...", 9, 10, 11, "...", 20]
// prev = 11

export default function InspectionPagination({
  page,
  totalPages,
  status = null,
  sortDir = "newest",
}: InspectionPaginationProps) {
  if (totalPages <= 1) return null;

  const navClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        href={
          page > 1 ? buildListHref({ page: page - 1, status, sortDir }) : "#"
        }
        className={cn(
          navClass,
          "text-foreground hover:bg-muted",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        Prev
      </Link>

      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className={cn(navClass, "text-muted-foreground")}
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildListHref({ page: p, status, sortDir })}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              navClass,
              p === page
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        href={
          page < totalPages
            ? buildListHref({ page: page + 1, status, sortDir })
            : "#"
        }
        className={cn(
          navClass,
          "text-foreground hover:bg-muted",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
