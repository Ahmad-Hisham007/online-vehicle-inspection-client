"use client";
import useDebounce from "@/app/hooks/useDebounce";
import { buildListAdminHref } from "@/app/lib/listing-url";
import { InspectionStatus } from "@/app/lib/types";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { FiSearch } from "react-icons/fi";

const DEFAULT_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Payment failed", value: "payment_failed" },
];

type DataToolBarProps = {
  initialSearchValue?: string;
  initialStatusFilter?: InspectionStatus | null | undefined;
  initialRoleFilter?: string | null | undefined;
  filterOptions?: { label: string; value: string }[];
  filterParamName?: "status" | "role";
  startTransition: React.TransitionStartFunction;
  isPending: boolean;
};

const DataToolbar = ({
  initialSearchValue,
  initialStatusFilter,
  initialRoleFilter,
  filterOptions = DEFAULT_FILTER_OPTIONS,
  filterParamName = "status",
  isPending,
  startTransition,
}: DataToolBarProps) => {
  const router = useRouter();
  const path = usePathname().split("?")[0];
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const initialValue =
    filterParamName === "role"
      ? (initialRoleFilter ?? "all")
      : (initialStatusFilter ?? "all");
  const [filterValue, setFilterValue] = useState(initialValue);

  const debouncedSearch = useDebounce(searchValue, 500);

  const navigateWithFilter = (search: string, filter: string) => {
    const href =
      filterParamName === "role"
        ? buildListAdminHref({
            page: 1,
            role: filter === "all" ? null : filter,
            search,
          })
        : buildListAdminHref({
            page: 1,
            status:
              filter === "all" ? null : (filter as InspectionStatus),
            search,
          });
    router.push(`${path}${href}`);
  };

  useEffect(() => {
    if (searchValue === initialSearchValue) return;
    startTransition(() => {
      navigateWithFilter(debouncedSearch ?? "", filterValue);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterValue(value);
    startTransition(() => {
      navigateWithFilter(searchValue ?? "", value);
    });
  };

  return (
    <div className="md:mb-4 mb-0 flex w-full items-center justify-between flex-col md:flex-row gap-2 ">
      <div className="relative w-full">
        <FiSearch className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={handleSearch}
          disabled={isPending}
          aria-label="Search"
          className={
            "md:w-56 w-full pl-7 h-8.5 border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary"
          }
        />
      </div>

      {filterOptions.length > 0 && (
        <select
          value={filterValue}
          onChange={handleFilterChange}
          aria-label="Filter"
          disabled={isPending}
          className={
            "w-full md:w-auto h-[34px] border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary"
          }
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default DataToolbar;
