"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers";
import Stripe from "stripe";
import { wpFetch } from "@/app/lib/wp-auth";
import {
  createInspectionDraft,
  type InspectionFormData,
} from "@/app/actions/inspection";
import { fetchInspection } from "@/app/actions/inspections";
import type { InspectionDetail } from "@/app/lib/types";

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

interface UpdateInspectionPaymentResponse {
  updateInspectionPayment: {
    inspectionPayment: { id: string };
  };
}

interface UpdateInspectionResponse {
  updateInspection: {
    inspection: { id: string };
  };
}

interface CreateInspectionPaymentResponse {
  createInspectionPayment: {
    inspectionPayment: {
      id: string;
      databaseId: number;
    };
  };
}

export async function confirmInspectionPayment(
  inspectionId: string,
  paymentId: string,
  paymentIntentId: string,
) {
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

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const verified =
    (paymentIntent.status === "succeeded" ||
      paymentIntent.status === "processing") &&
    paymentIntent.metadata?.inspectionId === inspectionId &&
    paymentIntent.metadata?.wpPaymentId === paymentId;

  const status: "succeeded" | "failed" = verified ? "succeeded" : "failed";
  const errorLog = verified
    ? undefined
    : paymentIntent.last_payment_error?.message ??
      "PaymentIntent did not reach a successful state";

  const now = new Date();
  const timestamp = formatTimestamp(now);

  const updatePaymentMutation = `
    mutation UpdateInspectionPayment($input: UpdateInspectionPaymentInput!) {
      updateInspectionPayment(input: $input) {
        inspectionPayment { id }
      }
    }
  `;

  await wpFetch<UpdateInspectionPaymentResponse>(
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
  );

  const updateInspectionMutation = `
    mutation UpdateInspection($input: UpdateInspectionInput!) {
      updateInspection(input: $input) {
        inspection { id }
      }
    }
  `;

  const inspectionStatus = status === "succeeded" ? "paid" : "payment_failed";

  await wpFetch<UpdateInspectionResponse>(
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
  );

  revalidatePath("/dashboard/customer");
  revalidatePath(`/dashboard/customer/inspection/${inspectionId}`);
}

interface GetInspectionForPaymentResponse {
  inspection: {
    databaseId: number;
    author: {
      node: {
        databaseId: number;
      };
    } | null;
    inspectionDetails: {
      orderSubtotal: string;
    };
  } | null;
}

export async function createPaymentIntent(
  inspectionId: string,
): Promise<{ clientSecret: string; paymentId: string; returnUrl: string }> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const inspectionQuery = `
    query GetInspectionForPayment($id: ID!) {
      inspection(id: $id, idType: DATABASE_ID) {
        databaseId
        author {
          node {
            databaseId
          }
        }
        inspectionDetails {
          orderSubtotal
        }
      }
    }
  `;

  const inspection = await wpFetch<GetInspectionForPaymentResponse>(
    inspectionQuery,
    { id: inspectionId },
  );

  const node = inspection.inspection;
  if (!node) {
    throw new Error("Inspection not found");
  }

  if (node.author?.node?.databaseId !== session.user.wpId) {
    throw new Error("Unauthorized");
  }

  const amountCents = Math.round(
    parseFloat(node.inspectionDetails.orderSubtotal) * 100,
  );
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Invalid inspection price");
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
    (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000");

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

  const data = await wpFetch<CreateInspectionPaymentResponse>(mutation, variables);

  const paymentId =
    data.createInspectionPayment.inspectionPayment.databaseId.toString();

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

export type PaymentSetup =
  | { alreadyPaid: true; inspection: InspectionDetail }
  | {
      alreadyPaid: false;
      inspection: InspectionDetail;
      clientSecret: string;
      paymentId: string;
      returnUrl: string;
    };

export async function getPaymentSetup(
  inspectionId: string,
): Promise<PaymentSetup> {
  const inspection = await fetchInspection(inspectionId);

  if (inspection.paymentStatus === "succeeded") {
    return { alreadyPaid: true, inspection };
  }

  const setup = await createPaymentIntent(inspectionId);
  return { alreadyPaid: false, inspection, ...setup };
}

export async function createInspectionAndPaymentIntent(
  formData: InspectionFormData,
): Promise<{
  inspectionId: string;
  clientSecret: string;
  paymentId: string;
  returnUrl: string;
}> {
  const { inspectionId } = await createInspectionDraft(formData);
  const setup = await createPaymentIntent(inspectionId);
  return { inspectionId, ...setup };
}
