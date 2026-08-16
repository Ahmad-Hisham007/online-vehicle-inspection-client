import type { InspectionStatus, SortDir } from "@/app/lib/types";

export interface ListHrefOptions {
  page?: number;
  status?: InspectionStatus | null;
  sortDir?: SortDir;
}

export function buildListHref({
  page = 1,
  status = null,
  sortDir = "newest",
}: ListHrefOptions = {}): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (sortDir !== "newest") params.set("sort", sortDir);
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/dashboard/customer?${qs}` : "/dashboard/customer";
}
