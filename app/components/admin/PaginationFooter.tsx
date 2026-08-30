"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { InspectionStatus } from "@/app/lib/types";
import Link from "next/link";
import { buildListAdminHref } from "@/app/lib/listing-url";
import { usePathname } from "next/navigation";

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  status?: InspectionStatus | null;
  search?: string;

  totalItems: number;
  pageSize?: number;
  // onPageChange: (page: number) => void;
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

function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([
    1,
    2,
    page - 1,
    page,
    page + 1,
    totalPages - 1,
    totalPages,
  ]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function PaginationFooter({
  page,
  totalPages,
  search,
  status,
  totalItems,
  pageSize = 10,
}: PaginationFooterProps) {
  const path = usePathname().split("?")[0];
  if (totalItems < 1) {
    return (
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
        <span className="text-[13px] text-muted-foreground">
          Showing 0 items
        </span>
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
      <span className="text-[13px] text-muted-foreground">
        Showing {from}–{to} of {totalItems} items
      </span>

      <div className="inline-flex items-center gap-1">
        <Link
          href={
            page <= 1
              ? "#"
              : `${path}${buildListAdminHref({ page: page - 1, status, search })}`
          }
          aria-label="Previous page"
          className="flex h-7 min-w-[28px] items-center justify-center rounded border border-border px-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <FiChevronLeft className="size-3.5" />
        </Link>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-[13px] text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={`${path}${buildListAdminHref({ page: p, status, search })}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-7 min-w-[28px] items-center justify-center rounded border px-1.5 text-[13px] transition-colors",
                p === page
                  ? "border-primary bg-primary font-medium text-white"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {p}
            </Link>
          ),
        )}

        <Link
          href={
            page >= totalPages
              ? "#"
              : `${path}${buildListAdminHref({ page: page + 1, status, search })}`
          }
          aria-label="Next page"
          className="flex h-7 min-w-[28px] items-center justify-center rounded border border-border px-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <FiChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
