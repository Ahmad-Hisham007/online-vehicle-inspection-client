"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaymentForm } from "@/app/components/PaymentForm";
import { Button } from "@/app/components/Button";
import CustomerPageShell from "@/app/components/customer/CustomerPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchInspection } from "@/app/actions/inspections";
import { createPaymentIntent } from "@/app/actions/payment";
import type { InspectionDetail } from "@/app/lib/types";

interface PaymentSetup {
  clientSecret: string;
  paymentId: string;
  returnUrl: string;
}

export default function PayInspectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [payment, setPayment] = useState<PaymentSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backToDetail = useCallback(() => {
    router.push(`/dashboard/customer/inspection/${id}`);
  }, [id, router]);

  const startPayment = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchInspection(id)
      .then((detail) => {
        setInspection(detail);
        if (detail.paymentStatus === "succeeded") {
          return;
        }
        const amountCents = Math.round(Number(detail.orderSubtotal) * 100);
        return createPaymentIntent(id, amountCents);
      })
      .then((setup) => {
        if (setup) {
          setPayment(setup);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to start payment"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let active = true;
    fetchInspection(id)
      .then((detail) => {
        if (!active) return;
        setInspection(detail);
        if (detail.paymentStatus === "succeeded") {
          return;
        }
        const amountCents = Math.round(Number(detail.orderSubtotal) * 100);
        return createPaymentIntent(id, amountCents);
      })
      .then((setup) => {
        if (active && setup) {
          setPayment(setup);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to start payment",
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

  if (loading) {
    return (
      <CustomerPageShell>
        <div className="flex h-full flex-col p-4">
          <Skeleton className="mx-auto h-6 w-44" />
          <div className="mt-6 rounded-2xl border border-border p-6">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-3 w-12" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-xl" />
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-11 flex-1 rounded-full" />
              <Skeleton className="h-11 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </CustomerPageShell>
    );
  }

  if (error) {
    return (
      <CustomerPageShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="!w-auto !px-6"
              type="button"
              onClick={startPayment}
            >
              Retry
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="!w-auto !px-6"
              type="button"
              onClick={backToDetail}
            >
              Back to inspection
            </Button>
          </div>
        </div>
      </CustomerPageShell>
    );
  }

  if (inspection?.paymentStatus === "succeeded") {
    return (
      <CustomerPageShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This inspection is already paid.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="!w-auto !px-6"
            type="button"
            onClick={backToDetail}
          >
            View details
          </Button>
        </div>
      </CustomerPageShell>
    );
  }

  if (!payment) {
    return (
      <CustomerPageShell>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Unable to start payment.
          </p>
        </div>
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell>
      <div className="flex h-full flex-col p-4">
        <h1 className="mb-4 text-center text-xl font-bold text-foreground">
          Complete payment
        </h1>
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border p-6">
          {inspection && (
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-primary">
                  License Plate
                </p>
                <p className="font-medium text-foreground">
                  {inspection.licensePlate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-primary">Amount</p>
                <p className="font-medium text-foreground">
                  ${inspection.orderSubtotal}
                </p>
              </div>
            </div>
          )}
          <PaymentForm
            clientSecret={payment.clientSecret}
            returnUrl={payment.returnUrl}
            inspectionId={id}
            paymentId={payment.paymentId}
            onSuccess={() => router.push(payment.returnUrl)}
            onRetry={startPayment}
            onCancel={backToDetail}
          />
        </div>
      </div>
    </CustomerPageShell>
  );
}
