import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

import { GET } from "@/app/api/payment/status/route";

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

function makeRequest(inspectionId: string | null): Request {
  const url = inspectionId
    ? `http://localhost:3000/api/payment/status?inspectionId=${inspectionId}`
    : "http://localhost:3000/api/payment/status";
  return new Request(url);
}

describe("GET /api/payment/status", () => {
  it("returns 400 when inspectionId is missing", async () => {
    const res = await GET(makeRequest(null));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("inspectionId is required");
  });

  it("returns inspection status and payment status", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            inspection: {
              inspectionDetails: {
                inspectionStatus: "paid",
                paymentStatus: "succeeded",
              },
            },
          },
        }),
    });

    const res = await GET(makeRequest("123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.inspectionStatus).toBe("paid");
    expect(body.paymentStatus).toBe("succeeded");
  });

  it("returns pending status for unpaid inspection", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            inspection: {
              inspectionDetails: {
                inspectionStatus: "pending",
                paymentStatus: "pending",
              },
            },
          },
        }),
    });

    const res = await GET(makeRequest("456"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.inspectionStatus).toBe("pending");
    expect(body.paymentStatus).toBe("pending");
  });

  it("returns 500 when WPGraphQL returns errors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Inspection not found" }],
        }),
    });

    const res = await GET(makeRequest("999"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch inspection status");
  });

  it("returns 404 when inspection data is null", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            inspection: null,
          },
        }),
    });

    const res = await GET(makeRequest("999"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Inspection not found");
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const res = await GET(makeRequest("123"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server error fetching payment status");
  });

  it("sends correct GraphQL query to WPGraphQL", async () => {
    let capturedBody: { query: string; variables: { id: string } };

    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        capturedBody = JSON.parse(opts.body as string);
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                inspection: {
                  inspectionDetails: {
                    inspectionStatus: "pending",
                    paymentStatus: "pending",
                  },
                },
              },
            }),
        };
      },
    );

    await GET(makeRequest("123"));

    expect(capturedBody!.variables.id).toBe("123");
    expect(capturedBody!.query).toContain("GetInspectionStatus");
    expect(capturedBody!.query).toContain("inspectionDetails");
    expect(capturedBody!.query).toContain("inspectionStatus");
    expect(capturedBody!.query).toContain("paymentStatus");
  });
});
