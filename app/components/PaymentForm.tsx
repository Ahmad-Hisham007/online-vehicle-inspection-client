"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/app/components/Button";
import toast from "react-hot-toast";
import { confirmInspectionPayment } from "@/app/actions/payment";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface PaymentFormProps {
  clientSecret: string;
  returnUrl: string;
  inspectionId: string;
  paymentId: string;
  onSuccess: () => void;
  onRetry: () => void;
}

function PaymentFormInner({
  clientSecret,
  returnUrl,
  inspectionId,
  paymentId,
  onSuccess,
  onRetry,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Validation failed");
      toast.error(submitError.message ?? "Validation failed");
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } =
      await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      toast.error(confirmError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success("Payment successful!");
      confirmInspectionPayment(inspectionId, paymentId, "succeeded").catch(
        () => {},
      );
      onSuccess();
    } else if (paymentIntent?.status === "processing") {
      toast.success("Payment is processing...");
      confirmInspectionPayment(inspectionId, paymentId, "succeeded").catch(
        () => {},
      );
      onSuccess();
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">
          Loading payment form...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay Now"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret }}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}
