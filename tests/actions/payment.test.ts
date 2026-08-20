import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockPaymentIntentsCreate = vi.hoisted(() => vi.fn());
const mockPaymentIntentsUpdate = vi.hoisted(() => vi.fn());
const mockPaymentIntentsRetrieve = vi.hoisted(() => vi.fn());
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
        retrieve: mockPaymentIntentsRetrieve,
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
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
  const authUser = {
    accessToken: "test-token",
    refreshToken: "test-refresh",
    refreshTokenExpiration: Date.now() + 3600000,
    accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
    email: "customer@example.com",
    name: "John Doe",
    wpId: 1,
  };

  const inspectionResponse = (orderSubtotal: string) => ({
    ok: true,
    json: () =>
      Promise.resolve({
        data: {
          inspection: {
            databaseId: 123,
            author: { node: { databaseId: 1 } },
            inspectionDetails: { orderSubtotal },
          },
        },
      }),
  });

  const paymentResponse = {
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

  const mockInspectionThenPayment = (orderSubtotal = "39") => {
    mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string) as { query?: string };
      if (body.query?.includes("GetInspectionForPayment")) {
        return inspectionResponse(orderSubtotal);
      }
      return paymentResponse;
    });
  };

  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createPaymentIntent("123")).rejects.toThrow("Unauthorized");
  });

  it("throws if STRIPE_SECRET_KEY is not configured", async () => {
    mockAuth.mockResolvedValue({ user: authUser });
    delete process.env.STRIPE_SECRET_KEY;

    await expect(createPaymentIntent("123")).rejects.toThrow(
      "STRIPE_SECRET_KEY is not configured",
    );
  });

  it("throws if inspection is not found", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    mockAuth.mockResolvedValue({ user: authUser });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { inspection: null } }),
    });

    await expect(createPaymentIntent("123")).rejects.toThrow(
      "Inspection not found",
    );
  });

  it("throws if inspection belongs to another user", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    mockAuth.mockResolvedValue({ user: authUser });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            inspection: {
              databaseId: 123,
              author: { node: { databaseId: 999 } },
              inspectionDetails: { orderSubtotal: "39" },
            },
          },
        }),
    });

    await expect(createPaymentIntent("123")).rejects.toThrow("Unauthorized");
  });

  it("creates PaymentIntent from server-side price and returns clientSecret, paymentId, returnUrl", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    mockAuth.mockResolvedValue({ user: authUser });
    mockInspectionThenPayment();

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R123456789",
      client_secret: "pi_3R123456789_secret_abc123",
      amount: 3900,
      currency: "usd",
      metadata: { inspectionId: "123" },
    });

    const result = await createPaymentIntent("123");

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 3900,
      currency: "usd",
      metadata: { inspectionId: "123" },
      automatic_payment_methods: { enabled: true },
    });
    expect(result.clientSecret).toBe("pi_3R123456789_secret_abc123");
    expect(result.paymentId).toBe("567");
    expect(result.returnUrl).toBe(
      "http://localhost:3000/dashboard/customer/success?inspectionId=123&paymentId=567",
    );

    expect(mockPaymentIntentsUpdate).toHaveBeenCalledWith("pi_3R123456789", {
      metadata: { inspectionId: "123", wpPaymentId: "567" },
    });
  });

  it("charges the inspection orderSubtotal regardless of any client amount", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    mockAuth.mockResolvedValue({ user: authUser });
    mockInspectionThenPayment("63");

    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3R999999999",
      client_secret: "pi_3R999999999_secret_def456",
      amount: 6300,
      currency: "usd",
      metadata: { inspectionId: "456" },
    });

    await createPaymentIntent("456");

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 6300,
      currency: "usd",
      metadata: { inspectionId: "456" },
      automatic_payment_methods: { enabled: true },
    });
  });

  it("sends correct WPGraphQL mutation with payment data", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    mockAuth.mockResolvedValue({ user: authUser });

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

    mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string) as { query?: string };
      if (body.query?.includes("GetInspectionForPayment")) {
        return inspectionResponse("39");
      }
      capturedBody = body as typeof capturedBody;
      return paymentResponse;
    });

    await createPaymentIntent("123");

    const pf = capturedBody!.variables.input.paymentFields;
    expect(capturedBody!.variables.input.title).toBe(
      "Payment for Inspection #123",
    );
    expect(pf.stripeId).toBe("pi_3R123456789");
    expect(pf.amount).toBe(39);
    expect(pf.currency).toBe("usd");
    expect(pf.status).toBe("pending");
    expect(pf.inspectionId).toBe(123);
    expect(pf.customerEmail).toBe("customer@example.com");
    expect(pf.customerName).toBe("John Doe");
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
    mockAuth.mockResolvedValue({ user: authUser });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [
            {
              message:
                "Field 'unknownField' not found on type 'InspectionPayment'",
            },
          ],
        }),
    });

    await expect(createPaymentIntent("123")).rejects.toThrow(
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
      confirmInspectionPayment("123", "567", "pi_3R123456789"),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws if STRIPE_SECRET_KEY is not configured", async () => {
    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        refreshTokenExpiration: Date.now() + 3600000,
        accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      },
    });
    delete process.env.STRIPE_SECRET_KEY;

    await expect(
      confirmInspectionPayment("123", "567", "pi_3R123456789"),
    ).rejects.toThrow("STRIPE_SECRET_KEY is not configured");
  });

  it("updates both payment and inspection CPTs when Stripe confirms succeeded", async () => {
    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        refreshTokenExpiration: Date.now() + 3600000,
        accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      },
    });

    mockPaymentIntentsRetrieve.mockResolvedValue({
      id: "pi_3R123456789",
      status: "succeeded",
      metadata: { inspectionId: "123", wpPaymentId: "567" },
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

    await confirmInspectionPayment("123", "567", "pi_3R123456789");

    expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith("pi_3R123456789");
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

  it("marks failed when Stripe reports the PaymentIntent did not succeed", async () => {
    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        refreshTokenExpiration: Date.now() + 3600000,
        accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      },
    });

    mockPaymentIntentsRetrieve.mockResolvedValue({
      id: "pi_3R123456789",
      status: "requires_payment_method",
      metadata: { inspectionId: "123", wpPaymentId: "567" },
      last_payment_error: { message: "Your card was declined." },
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

    await confirmInspectionPayment("123", "567", "pi_3R123456789");

    const paymentUpdate = capturedBodies[0];
    expect(
      (paymentUpdate.variables.input as Record<string, unknown>)
        .paymentFields as Record<string, unknown>,
    ).toMatchObject({
      status: "failed",
      errorLog: "Your card was declined.",
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

  it("marks failed when PaymentIntent metadata does not match the inspection", async () => {
    mockAuth.mockResolvedValue({
      user: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        refreshTokenExpiration: Date.now() + 3600000,
        accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      },
    });

    mockPaymentIntentsRetrieve.mockResolvedValue({
      id: "pi_3R123456789",
      status: "succeeded",
      metadata: { inspectionId: "999", wpPaymentId: "999" },
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

    await confirmInspectionPayment("123", "567", "pi_3R123456789");

    const paymentUpdate = capturedBodies[0];
    expect(
      (paymentUpdate.variables.input as Record<string, unknown>)
        .paymentFields as Record<string, unknown>,
    ).toMatchObject({
      status: "failed",
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
      user: {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        refreshTokenExpiration: Date.now() + 3600000,
        accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      },
    });

    mockPaymentIntentsRetrieve.mockResolvedValue({
      id: "pi_3R123456789",
      status: "succeeded",
      metadata: { inspectionId: "123", wpPaymentId: "567" },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Field 'unknownField' not found" }],
        }),
    });

    await expect(
      confirmInspectionPayment("123", "567", "pi_3R123456789"),
    ).rejects.toThrow("Field 'unknownField' not found");
  });
});
