"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InspectionDetailView from "@/app/components/InspectionDetailView/InspectionDetailView";
import { fetchInspection } from "@/app/actions/inspections";
import { Button } from "@/app/components/Button";
import type { InspectionDetail } from "@/app/lib/types";

export default function AdminInspectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchInspection(id)
      .then(setInspection)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load inspection",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let active = true;
    fetchInspection(id)
      .then((data) => {
        if (active) setInspection(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load inspection",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <section className="flex min-h-screen flex-col bg-gray-900">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div
          className={
            "flex min-h-0 flex-1 flex-col overflow-clip rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-sm"
          }
        >
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-gray-400">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="!w-auto !px-6"
                type="button"
                onClick={load}
              >
                Retry
              </Button>
            </div>
          ) : inspection ? (
            <InspectionDetailView inspection={inspection} role="admin" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
