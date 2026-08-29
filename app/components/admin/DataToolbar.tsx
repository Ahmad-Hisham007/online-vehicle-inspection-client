"use client";
import { buildListAdminHref } from "@/app/lib/listing-url";
import { InspectionStatus } from "@/app/lib/types";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
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
};

const DataToolbar = ({
  initialSearchValue,
  initialStatusFilter,
}: DataToolBarProps) => {
  const router = useRouter();
  const path = usePathname().split("?")[0];
  console.log(router, path);
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [statusFilter, setStatusFilter] = useState(
    initialStatusFilter ?? "all",
  );
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    startTransition(() => {
      const href = buildListAdminHref({
        page: 1,
        status:
          statusFilter === "all" ? null : (statusFilter as InspectionStatus),
        search: value,
      });

      router.push(`${path}${href}`);
    });
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
    <div className="mb-4 flex w-full items-center justify-between gap-2">
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={handleSearch}
          disabled={pending}
          aria-label="Inspection Requests Search"
          className={
            "w-56 pl-7 h-[34px] border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary"
          }
        />
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label="Filter"
          disabled={pending}
          className={
            "w-auto h-[34px] border border-border rounded bg-white px-2 py-1 text-[13px] leading-none text-slate-700 focus:outline-none focus:border-primary"
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
