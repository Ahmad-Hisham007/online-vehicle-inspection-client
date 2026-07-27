"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import Stripe from "stripe";

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

async function wpMutate(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
) {
  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error("WPGraphQL mutation error:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json;
}

export async function confirmInspectionPayment(
  inspectionId: string,
  paymentId: string,
  status: "succeeded" | "failed",
  errorLog?: string | null,
) {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const timestamp = formatTimestamp(now);

  const updatePaymentMutation = `
    mutation UpdateInspectionPayment($input: UpdateInspectionPaymentInput!) {
      updateInspectionPayment(input: $input) {
        inspectionPayment { id }
      }
    }
  `;

  await wpMutate(
    updatePaymentMutation,
    {
      input: {
        id: paymentId,
        paymentFields: {
          status,
          webhookReceived: true,
          webhookTimestamp: timestamp,
          ...(errorLog ? { errorLog } : {}),
        },
      },
    },
    session.user.accessToken,
  );

  const updateInspectionMutation = `
    mutation UpdateInspection($input: UpdateInspectionInput!) {
      updateInspection(input: $input) {
        inspection { id }
      }
    }
  `;

  const inspectionStatus = status === "succeeded" ? "paid" : "payment_failed";

  await wpMutate(
    updateInspectionMutation,
    {
      input: {
        id: inspectionId,
        inspectionDetails: {
          paymentStatus: status,
          inspectionStatus,
        },
      },
    },
    session.user.accessToken,
  );
}

export async function createPaymentIntent(
  inspectionId: string,
  amountCents: number,
): Promise<{ clientSecret: string; paymentId: string; returnUrl: string }> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-06-24.dahlia",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: { inspectionId },
    automatic_payment_methods: { enabled: true },
  });

  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    `https://${headersList.get("host")}` ||
    "http://localhost:3000";

  const mutation = `
    mutation CreateInspectionPayment($input: CreateInspectionPaymentInput!) {
      createInspectionPayment(input: $input) {
        inspectionPayment {
          id
          databaseId
        }
      }
    }
  `;

  const variables = {
    input: {
      title: `Payment for Inspection #${inspectionId}`,
      status: "PUBLISH",
      paymentFields: {
        stripeId: paymentIntent.id,
        amount: Math.round(amountCents / 100),
        currency: "usd",
        status: "pending",
        inspectionId: Number(inspectionId),
        customerEmail: session.user.email || "",
        customerName: session.user.name || "",
        stripeClientSecret: paymentIntent.client_secret,
        webhookReceived: false,
        webhookTimestamp: null,
        errorLog: null,
        metadata: [
          { key: "user_ip", value: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown" },
          { key: "user_agent", value: (headersList.get("user-agent") || "unknown").slice(0, 255) },
          { key: "referrer", value: headersList.get("referer") || "unknown" },
          { key: "payment_method", value: "card" },
          { key: "amount_cents", value: String(amountCents) },
        ],
      },
    },
  };

  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user.accessToken}`,
      Origin: origin,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error("WPGraphQL createInspectionPayment errors:", json.errors);
    throw new Error(json.errors[0].message);
  }

  const paymentId =
    json.data.createInspectionPayment.inspectionPayment.databaseId.toString();

  await stripe.paymentIntents.update(paymentIntent.id, {
    metadata: { inspectionId, wpPaymentId: paymentId },
  });

  const returnUrl = `${origin}/dashboard/customer/success?inspectionId=${inspectionId}&paymentId=${paymentId}`;

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentId,
    returnUrl,
  };
}
