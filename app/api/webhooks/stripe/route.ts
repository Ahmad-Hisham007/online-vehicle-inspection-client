import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

let authToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (authToken) return authToken;

  const username = process.env.WP_WEBHOOK_USERNAME;
  const password = process.env.WP_WEBHOOK_PASSWORD;

  if (!username || !password) {
    throw new Error("WP_WEBHOOK_USERNAME and WP_WEBHOOK_PASSWORD must be configured");
  }

  const loginMutation = `
    mutation LoginUser($input: LoginInput!) {
      login(input: $input) {
        authToken
      }
    }
  `;

  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      query: loginMutation,
      variables: { input: { username, password } },
    }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error("WPGraphQL login error:", json.errors);
    throw new Error("Failed to authenticate with WordPress");
  }

  authToken = json.data.login.authToken;
  return authToken!;
}

async function wpMutate(query: string, variables: Record<string, unknown>) {
  const token = await getAuthToken();
  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function updatePaymentStatus(
  paymentId: string,
  status: string,
  errorLog?: string | null,
) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const mutation = `
    mutation UpdateInspectionPayment($input: UpdateInspectionPaymentInput!) {
      updateInspectionPayment(input: $input) {
        inspectionPayment {
          id
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    input: {
      id: paymentId,
      paymentFields: {
        status,
        webhookReceived: true,
        webhookTimestamp: timestamp,
      },
    },
  };

  if (errorLog) {
    (variables.input as Record<string, unknown>).paymentFields = {
      ...(variables.input as Record<string, unknown>).paymentFields as Record<string, unknown>,
      errorLog,
    };
  }

  const json = await wpMutate(mutation, variables);
  if (json.errors) {
    console.error("Update payment error:", json.errors);
    throw new Error(json.errors[0].message);
  }
}

async function updateInspectionStatus(
  inspectionId: string,
  paymentStatus: string,
  inspectionStatus: string,
) {
  const mutation = `
    mutation UpdateInspection($input: UpdateInspectionInput!) {
      updateInspection(input: $input) {
        inspection {
          id
        }
      }
    }
  `;

  const variables = {
    input: {
      id: inspectionId,
      inspectionDetails: {
        paymentStatus,
        inspectionStatus,
      },
    },
  };

  const json = await wpMutate(mutation, variables);
  if (json.errors) {
    console.error("Update inspection error:", json.errors);
    throw new Error(json.errors[0].message);
  }
}

type PaymentIntent = Stripe.PaymentIntent;

async function handleSucceeded(pi: PaymentIntent) {
  const inspectionId = pi.metadata.inspectionId;
  const wpPaymentId = pi.metadata.wpPaymentId;
  if (!inspectionId || !wpPaymentId) return;

  await updatePaymentStatus(wpPaymentId, "succeeded");
  await updateInspectionStatus(inspectionId, "succeeded", "paid");
}

async function handleFailed(pi: PaymentIntent) {
  const inspectionId = pi.metadata.inspectionId;
  const wpPaymentId = pi.metadata.wpPaymentId;
  if (!inspectionId || !wpPaymentId) return;

  const errorLog = pi.last_payment_error?.message ?? null;
  await updatePaymentStatus(wpPaymentId, "failed", errorLog);
  await updateInspectionStatus(inspectionId, "failed", "payment_failed");
}

async function handleRequiresAction(pi: PaymentIntent) {
  const inspectionId = pi.metadata.inspectionId;
  const wpPaymentId = pi.metadata.wpPaymentId;
  if (!inspectionId || !wpPaymentId) return;

  await updatePaymentStatus(wpPaymentId, "requires_action");
  await updateInspectionStatus(inspectionId, "requires_action", "pending");
}

async function handleCanceled(pi: PaymentIntent) {
  const inspectionId = pi.metadata.inspectionId;
  const wpPaymentId = pi.metadata.wpPaymentId;
  if (!inspectionId || !wpPaymentId) return;

  await updatePaymentStatus(wpPaymentId, "refunded");
  await updateInspectionStatus(inspectionId, "refunded", "cancelled");
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    const pi = event.data.object as PaymentIntent;

    switch (event.type) {
      case "payment_intent.succeeded":
        await handleSucceeded(pi);
        break;
      case "payment_intent.payment_failed":
        await handleFailed(pi);
        break;
      case "payment_intent.requires_action":
        await handleRequiresAction(pi);
        break;
      case "payment_intent.canceled":
        await handleCanceled(pi);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
