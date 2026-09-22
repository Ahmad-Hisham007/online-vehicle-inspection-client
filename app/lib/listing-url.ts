import { type InspectionStatus, type SortDir } from "@/app/lib/types";

export interface ListHrefOptions {
  page?: number;
  status?: InspectionStatus | null;
  sortDir?: SortDir;
}
export interface ListAdminHrefOptions {
  page?: number;
  status?: string | null;
  search?: string;
  role?: string | null;
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

export function buildListAdminHref({
  page = 1,
  status = null,
  search = "",
  role = null,
}: ListAdminHrefOptions = {}): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (role) params.set("role", role);
  if (search) params.set("search", search);
  if (page) params.set("page", String(page));
  const qs = params.toString();
  return `?${qs}`;
}