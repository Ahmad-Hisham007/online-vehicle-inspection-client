import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockConstructEvent = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: function () {
    return {
      webhooks: { constructEvent: mockConstructEvent },
    };
  },
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  global.fetch = mockFetch;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function makePiEvent(
  type: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    type,
    data: {
      object: {
        id: "pi_3R123456789",
        amount: 3900,
        currency: "usd",
        metadata: { inspectionId: "123", wpPaymentId: "567" },
        last_payment_error: null,
        ...overrides,
      },
    },
  };
}

function makeRequest(body: string, sig: string | null): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sig !== null) {
    headers["stripe-signature"] = sig;
  }
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    process.env.WP_WEBHOOK_USERNAME = "webhook";
    process.env.WP_WEBHOOK_PASSWORD = "webhook_pass";
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await POST(makeRequest("{}", null));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing stripe-signature header");
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    const res = await POST(makeRequest("{}", "dummy_sig"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Webhook secret not configured");
  });

  it("returns 500 on invalid signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeRequest('{"type":"test"}', "invalid_sig"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Webhook processing failed");
  });

  it("handles payment_intent.succeeded and updates both CPTs", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue(makePiEvent("payment_intent.succeeded"));

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("LoginUser")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({ data: { login: { authToken: "test-jwt-token-123" } } }),
          };
        }
        const isInspectionUpdate = body.query.includes("UpdateInspection(");
        return {
          ok: true,
          json: () =>
            isInspectionUpdate
              ? Promise.resolve({ data: { updateInspection: { inspection: { id: "cg==" } } } })
              : Promise.resolve({ data: { updateInspectionPayment: { inspectionPayment: { id: "cg==" } } } }),
        };
      },
    );

    const res = await POST(
      makeRequest(JSON.stringify(makePiEvent("payment_intent.succeeded")), "valid_sig"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("handles payment_intent.payment_failed with error log", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue(
      makePiEvent("payment_intent.payment_failed", {
        last_payment_error: { message: "Card declined" },
      }),
    );

    const capturedBodies: Array<{ query: string; variables: Record<string, unknown> }> = [];

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("LoginUser")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({ data: { login: { authToken: "test-jwt-token-123" } } }),
          };
        }
        capturedBodies.push(body);
        const isInspectionUpdate = body.query.includes("UpdateInspection");
        return {
          ok: true,
          json: () =>
            isInspectionUpdate
              ? Promise.resolve({ data: { updateInspection: { inspection: { id: "cg==" } } } })
              : Promise.resolve({ data: { updateInspectionPayment: { inspectionPayment: { id: "cg==" } } } }),
        };
      },
    );

    const res = await POST(
      makeRequest(JSON.stringify(makePiEvent("payment_intent.payment_failed")), "valid_sig"),
    );

    expect(res.status).toBe(200);
    expect(capturedBodies).toHaveLength(2);

    expect(
      (capturedBodies[0].variables.input as Record<string, unknown>).paymentFields as Record<string, unknown>,
    ).toMatchObject({
      status: "failed",
      errorLog: "Card declined",
    });

    expect(
      (capturedBodies[1].variables.input as Record<string, unknown>).inspectionDetails as Record<string, unknown>,
    ).toMatchObject({
      paymentStatus: "failed",
      inspectionStatus: "payment_failed",
    });
  });

  it("handles payment_intent.requires_action", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue(makePiEvent("payment_intent.requires_action"));

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("LoginUser")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({ data: { login: { authToken: "test-jwt-token-123" } } }),
          };
        }
        const isInspectionUpdate = body.query.includes("UpdateInspection(");
        return {
          ok: true,
          json: () =>
            isInspectionUpdate
              ? Promise.resolve({ data: { updateInspection: { inspection: { id: "cg==" } } } })
              : Promise.resolve({ data: { updateInspectionPayment: { inspectionPayment: { id: "cg==" } } } }),
        };
      },
    );

    const res = await POST(
      makeRequest(JSON.stringify(makePiEvent("payment_intent.requires_action")), "valid_sig"),
    );

    expect(res.status).toBe(200);
  });

  it("handles payment_intent.canceled", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue(makePiEvent("payment_intent.canceled"));

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("LoginUser")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({ data: { login: { authToken: "test-jwt-token-123" } } }),
          };
        }
        const isInspectionUpdate = body.query.includes("UpdateInspection");
        return {
          ok: true,
          json: () =>
            isInspectionUpdate
              ? Promise.resolve({ data: { updateInspection: { inspection: { id: "cg==" } } } })
              : Promise.resolve({ data: { updateInspectionPayment: { inspectionPayment: { id: "cg==" } } } }),
        };
      },
    );

    const res = await POST(
      makeRequest(JSON.stringify(makePiEvent("payment_intent.canceled")), "valid_sig"),
    );

    expect(res.status).toBe(200);
  });

  it("returns 200 for unhandled event types", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue(makePiEvent("charge.succeeded"));

    const res = await POST(
      makeRequest(JSON.stringify(makePiEvent("charge.succeeded")), "valid_sig"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles missing metadata gracefully", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockConstructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_3R999999999",
          metadata: {},
          last_payment_error: null,
        },
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    const res = await POST(
      makeRequest(JSON.stringify({ type: "payment_intent.succeeded" }), "valid_sig"),
    );

    expect(res.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
