"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inspectionId = searchParams.get("inspectionId");
  const mountedRef = useRef(true);

  useEffect(() => {
    const id = searchParams.get("inspectionId");
    if (!id) return;
    fetch(`/api/payment/status?inspectionId=${id}`).catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600">
            Invalid Request
          </h1>
          <p className="text-gray-500">No inspection ID provided.</p>
          <Button variant="primary" onClick={() => router.push("/dashboard/customer")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-4">
        <div className="size-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
          <svg className="size-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Payment Successful!
        </h1>
        <p className="text-sm text-gray-500">
          Your inspection has been submitted and is now being reviewed.
        </p>
        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <span className="text-gray-500">Inspection ID: </span>
          <span className="font-mono font-medium text-gray-900">
            #{inspectionId}
          </span>
        </div>
        <Button variant="primary" onClick={() => router.push("/dashboard/customer")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
