"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { InspectionStatus } from "@/app/lib/types";
import Link from "next/link";
import { buildListAdminHref } from "@/app/lib/listing-url";
import { usePathname, useRouter } from "next/navigation";

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  status?: string | null;
  search?: string;
  total?: number;
  pageSize?: number;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}

function pageNumbers(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
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

export default function PaginationFooter({
  page,
  totalPages,
  search,
  status,
  total = 0,
  pageSize = 10,
  isPending,
  startTransition,
}: PaginationFooterProps) {
  const router = useRouter();
  const path = usePathname().split("?")[0];
  if (total < 1) {
    return (
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
        <span className="text-[13px] text-muted-foreground">
          Showing 0 items
        </span>
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const paginationHandler = (targetPage: number) => {
    if (
      targetPage === page ||
      targetPage < 1 ||
      isPending ||
      targetPage > totalPages
    )
      return;

    const queryString = buildListAdminHref({
      page: targetPage,
      status,
      search,
    });
    const href = `${path}${queryString}`;

    if (startTransition) {
      startTransition(() => {
        router.push(href);
      });
    } else {
      router.push(href);
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
      <span className="text-[13px] text-muted-foreground">
        Showing {from}–{to} of {total} items
      </span>

      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1 || isPending}
          area-label={"Previous Page"}
          onClick={() => paginationHandler(page - 1)}
          aria-label="Previous page"
          className="flex h-7 min-w-[28px] items-center justify-center rounded border border-border px-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <FiChevronLeft className="size-3.5" />
        </button>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-[13px] text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              disabled={isPending}
              onClick={() => paginationHandler(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-7 min-w-[28px] items-center justify-center rounded border px-1.5 text-[13px] transition-colors",
                p === page
                  ? "border-primary bg-primary font-medium text-white"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages || isPending}
          onClick={() => paginationHandler(page + 1)}
          aria-label="Next page"
          className="flex h-7 min-w-[28px] items-center justify-center rounded border border-border px-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <FiChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
