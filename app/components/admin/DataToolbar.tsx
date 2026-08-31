"use client";
import useDebounce from "@/app/hooks/useDebounce";
import { buildListAdminHref } from "@/app/lib/listing-url";
import { InspectionStatus } from "@/app/lib/types";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { FiSearch } from "react-icons/fi";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Payment failed", value: "payment_failed" },
];

type DataToolBarProps = {
  initialSearchValue: string;
  initialStatusFilter: InspectionStatus | null | undefined;
  startTransition: React.TransitionStartFunction;
  isPending: boolean;
};

const DataToolbar = ({
  initialSearchValue,
  initialStatusFilter,
  isPending,
  startTransition,
}: DataToolBarProps) => {
  const router = useRouter();
  const path = usePathname().split("?")[0];
  console.log(router, path);
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [statusFilter, setStatusFilter] = useState(
    initialStatusFilter ?? "all",
  );

  const debouncedSearch = useDebounce(searchValue, 500);

  useEffect(() => {
    if (searchValue === initialSearchValue) return;
    startTransition(() => {
      const status =
        statusFilter === "all" ? null : (statusFilter as InspectionStatus);

      const href = buildListAdminHref({
        page: 1,
        status,
        search: debouncedSearch,
      });

      // console.log("🔍 Debounced search:", { debouncedSearch, status, href });
      router.push(`${path}${href}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    startTransition(() => {
      const href = buildListAdminHref({
        page: 1,
        status: value === "all" ? null : (value as InspectionStatus),
        search: searchValue,
      });
      console.log(value, href);
      router.push(`${path}${href}`);
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
          aria-label="Inspection Requests Search"
          className={
            "md:w-56 w-full pl-7 h-8.5 border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary"
          }
        />
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <select
          value={statusFilter}
          onChange={handleStatusChange}
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
