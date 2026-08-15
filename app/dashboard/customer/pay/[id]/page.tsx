"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaymentForm } from "@/app/components/PaymentForm";
import { Button } from "@/app/components/Button";
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
      <section className="flex min-h-screen flex-col bg-gray-900">
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-screen flex-col bg-gray-900">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-gray-400">{error}</p>
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
              onClick={() => router.push("/dashboard/customer")}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (inspection?.paymentStatus === "succeeded") {
    return (
      <section className="flex min-h-screen flex-col bg-gray-900">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-gray-300">
            This inspection is already paid.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="!w-auto !px-6"
            type="button"
            onClick={() =>
              router.push(`/dashboard/customer/inspection/${inspection.id}`)
            }
          >
            View details
          </Button>
        </div>
      </section>
    );
  }

  if (!payment) {
    return (
      <section className="flex min-h-screen flex-col bg-gray-900">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">Unable to start payment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col bg-gray-900">
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-center text-xl font-bold text-white">
          Complete payment
        </h1>
        <div className="rounded-2xl bg-card p-6 shadow-sm">
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
          />
        </div>
      </div>
    </section>
  );
}