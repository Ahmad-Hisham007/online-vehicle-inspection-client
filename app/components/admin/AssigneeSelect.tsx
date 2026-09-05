"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AssignedInspectorRef } from "@/app/lib/types";
import type { InspectorOption } from "@/app/actions/assignment";
import { assignInspector } from "@/app/actions/assignment";
import { FiX } from "react-icons/fi";

interface AssigneeSelectProps {
  inspectionId: string;
  current: AssignedInspectorRef | null;
  canAssign: boolean;
  inspectors: InspectorOption[];
  inspectorsLoading?: boolean;
}

export default function AssigneeSelect({
  inspectionId,
  current,
  canAssign,
  inspectors,
  inspectorsLoading = false,
}: AssigneeSelectProps) {
  const [selected, setSelected] = useState<number | null>(
    current?.databaseId ?? null,
  );
  const [busy, setBusy] = useState(false);

  const assigned = selected != null;
  const selectedName =
    inspectors.find((i) => i.databaseId === selected)?.name ??
    current?.name ??
    "";

  const change = (value: number | null) => {
    const prev = selected;
    setSelected(value);
    setBusy(true);
    assignInspector(inspectionId, value)
      .catch(() => setSelected(prev))
      .finally(() => setBusy(false));
  };

  const pill = (
    <span
      className={cn(
        "inline-flex min-w-24 shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        assigned
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      {assigned ? selectedName || "Assigned" : "Unassigned"}
    </span>
  );

  if (!canAssign) {
    return <div className="whitespace-nowrap">{pill}</div>;
  }

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {inspectorsLoading ? (
        <span className="h-7 w-28 animate-pulse rounded border border-border bg-muted" />
      ) : (
        <select
          aria-label="Assign inspector"
          value={selected ?? ""}
          disabled={busy}
          onChange={(e) =>
            change(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-7 w-32 rounded border border-border bg-background px-1.5 text-[12px] text-slate-700 outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">Assign…</option>
          {inspectors.map((i) => (
            <option key={i.databaseId} value={i.databaseId}>
              {i.name}
            </option>
          ))}
        </select>
      )}
      {assigned && (
        <button
          type="button"
          title="Remove assignment"
          aria-label="Remove assignment"
          disabled={busy}
          onClick={() => change(null)}
          className="flex size-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <FiX className="size-3.5" />
        </button>
      )}
    </div>
  );
}
