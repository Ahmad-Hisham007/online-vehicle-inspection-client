import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockPaymentIntentsCreate = vi.hoisted(() => vi.fn());
const mockPaymentIntentsUpdate = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("stripe", () => ({
  default: function () {
    return {
      paymentIntents: {
        create: mockPaymentIntentsCreate,
        update: mockPaymentIntentsUpdate,
      },
    };
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "origin") return "http://localhost:3000";
      return null;
    }),
  }),
}));

import { createPaymentIntent, confirmInspectionPayment } from "@/app/actions/payment";

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

describe("createPaymentIntent", () => {
  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createPaymentIntent("123", 3900)).rejects.toThrow("Unauthorized");
  });

  it("throws if STRIPE_SECRET_KEY is not configured", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token", email: "test@example.com" },
    });
    delete process.env.STRIPE_SECRET_KEY;

    await expect(createPaymentIntent("123", 3900)).rejects.toThrow(
      "STRIPE_SECRET_KEY is not configured",
    );
  });

  it("creates PaymentIntent and returns clientSecret, paymentId, returnUrl", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        email: "customer@example.com",
        name: "John Doe",
      },
    });

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R123456789",
      client_secret: "pi_3R123456789_secret_abc123",
      amount: 3900,
      currency: "usd",
      metadata: { inspectionId: "123" },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            createInspectionPayment: {
              inspectionPayment: {
                id: "cG9zdDo1Njc=",
                databaseId: 567,
              },
            },
          },
        }),
    });

    const result = await createPaymentIntent("123", 3900);

    expect(result.clientSecret).toBe("pi_3R123456789_secret_abc123");
    expect(result.paymentId).toBe("567");
    expect(result.returnUrl).toBe(
      "http://localhost:3000/dashboard/customer/success?inspectionId=123&paymentId=567",
    );

    expect(mockPaymentIntentsUpdate).toHaveBeenCalledWith("pi_3R123456789", {
      metadata: { inspectionId: "123", wpPaymentId: "567" },
    });
  });

  it("passes correct amount and metadata to Stripe", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token", email: "test@example.com" },
    });

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R999999999",
      client_secret: "pi_3R999999999_secret_def456",
      amount: 6300,
      currency: "usd",
      metadata: { inspectionId: "456" },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            createInspectionPayment: {
              inspectionPayment: {
                id: "cG9zdDo3ODk=",
                databaseId: 789,
              },
            },
          },
        }),
    });

    await createPaymentIntent("456", 6300);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 6300,
      currency: "usd",
      metadata: { inspectionId: "456" },
      automatic_payment_methods: { enabled: true },
    });
  });

  it("sends correct WPGraphQL mutation with payment data", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        email: "customer@example.com",
      },
    });

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R123456789",
      client_secret: "pi_3R123456789_secret_abc123",
      amount: 3900,
      currency: "usd",
    });

    let capturedBody: {
      query: string;
      variables: {
        input: {
          title: string;
          status: string;
          paymentFields: {
            stripeId: string;
            amount: number;
            currency: string;
            status: string;
            inspectionId: number;
            customerEmail: string;
            customerName: string;
            stripeClientSecret: string;
            webhookReceived: boolean;
            webhookTimestamp: string | null;
            errorLog: string | null;
            metadata: unknown[];
          };
        };
      };
    };

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        capturedBody = JSON.parse(opts.body as string);
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                createInspectionPayment: {
                  inspectionPayment: {
                    id: "cG9zdDo1Njc=",
                    databaseId: 567,
                  },
                },
              },
            }),
        };
      },
    );

    await createPaymentIntent("123", 3900);

    const pf = capturedBody!.variables.input.paymentFields;
    expect(capturedBody!.variables.input.title).toBe("Payment for Inspection #123");
    expect(pf.stripeId).toBe("pi_3R123456789");
    expect(pf.amount).toBe(39);
    expect(pf.currency).toBe("usd");
    expect(pf.status).toBe("pending");
    expect(pf.inspectionId).toBe(123);
    expect(pf.customerEmail).toBe("customer@example.com");
    expect(pf.customerName).toBe("");
    expect(pf.stripeClientSecret).toBe(
      "pi_3R123456789_secret_abc123",
    );
    expect(pf.webhookReceived).toBe(false);
    expect(pf.webhookTimestamp).toBeNull();
    expect(pf.errorLog).toBeNull();
    expect(pf.metadata).toEqual([
      { key: "user_ip", value: "unknown" },
      { key: "user_agent", value: "unknown" },
      { key: "referrer", value: "unknown" },
      { key: "payment_method", value: "card" },
      { key: "amount_cents", value: "3900" },
    ]);
  });

  it("throws when WPGraphQL returns errors", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";

    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token", email: "test@example.com" },
    });

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R123456789",
      client_secret: "pi_3R123456789_secret_abc123",
      amount: 3900,
      currency: "usd",
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Field 'unknownField' not found on type 'InspectionPayment'" }],
        }),
    });

    await expect(createPaymentIntent("123", 3900)).rejects.toThrow(
      "Field 'unknownField' not found on type 'InspectionPayment'",
    );
  });
});

describe("confirmInspectionPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    global.fetch = mockFetch;
  });

  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(
      confirmInspectionPayment("123", "567", "succeeded"),
    ).rejects.toThrow("Unauthorized");
  });

  it("updates both payment and inspection CPTs on success", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token" },
    });

    const capturedBodies: Array<{ query: string; variables: Record<string, unknown> }> = [];

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        capturedBodies.push(JSON.parse(opts.body as string));
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                updateInspectionPayment: { inspectionPayment: { id: "cg==" } },
              },
            }),
        };
      },
    );

    await confirmInspectionPayment("123", "567", "succeeded");

    expect(capturedBodies).toHaveLength(2);

    const paymentUpdate = capturedBodies[0];
    expect(paymentUpdate.query).toContain("UpdateInspectionPayment");
    expect(
      (paymentUpdate.variables.input as Record<string, unknown>)
        .paymentFields as Record<string, unknown>,
    ).toMatchObject({
      status: "succeeded",
      webhookReceived: true,
    });

    const inspectionUpdate = capturedBodies[1];
    expect(inspectionUpdate.query).toContain("UpdateInspection");
    expect(
      (inspectionUpdate.variables.input as Record<string, unknown>)
        .inspectionDetails as Record<string, unknown>,
    ).toMatchObject({
      paymentStatus: "succeeded",
      inspectionStatus: "paid",
    });
  });

  it("includes errorLog when status is failed", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token" },
    });

    const capturedBodies: Array<{ query: string; variables: Record<string, unknown> }> = [];

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        capturedBodies.push(JSON.parse(opts.body as string));
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                updateInspectionPayment: { inspectionPayment: { id: "cg==" } },
              },
            }),
        };
      },
    );

    await confirmInspectionPayment("123", "567", "failed", "Card declined");

    const paymentUpdate = capturedBodies[0];
    expect(
      (paymentUpdate.variables.input as Record<string, unknown>)
        .paymentFields as Record<string, unknown>,
    ).toMatchObject({
      status: "failed",
      errorLog: "Card declined",
    });

    const inspectionUpdate = capturedBodies[1];
    expect(
      (inspectionUpdate.variables.input as Record<string, unknown>)
        .inspectionDetails as Record<string, unknown>,
    ).toMatchObject({
      paymentStatus: "failed",
      inspectionStatus: "payment_failed",
    });
  });

  it("throws on WPGraphQL errors", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token" },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Field 'unknownField' not found" }],
        }),
    });

    await expect(
      confirmInspectionPayment("123", "567", "succeeded"),
    ).rejects.toThrow("Field 'unknownField' not found");
  });
});
