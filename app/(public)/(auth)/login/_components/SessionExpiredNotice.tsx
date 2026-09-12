"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Shows a one-time "session expired" note when the user lands on
 * /login?expired=1, then strips the query param so a refresh stays clean.
 */
const SessionExpiredNotice = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expired] = useState(() => searchParams.get("expired") === "1");
  const cleaned = useRef(false);

  useEffect(() => {
    if (!expired || cleaned.current) return;
    cleaned.current = true;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("expired");
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login", { scroll: false });
  }, [expired, searchParams, router]);

  if (!expired) return null;

  return (
    <p
      role="status"
      className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-700"
    >
      Your session expired. Please sign in again.
    </p>
  );
};

export default SessionExpiredNotice;
