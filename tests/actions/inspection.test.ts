import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { createInspectionDraft, submitReInspection, type InspectionFormData } from "@/app/actions/inspection";

interface GraphQLBody {
  query: string;
  variables: {
    input: {
      title: string;
      status: string;
      inspectionDetails: Record<string, unknown>;
    };
  };
}

const ORIGINAL_ENV = { ...process.env };

// Helper to create a valid authenticated session
function makeMockSession() {
  return {
    user: {
      accessToken: "test-token",
      refreshToken: "test-refresh",
      refreshTokenExpiration: Date.now() + 3600000,
      accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
      wpId: 1,
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  global.fetch = mockFetch;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function makeValidFormData() {
  return {
    vehicleInfo: { licensePlate: "ABC123", mileage: 50000 },
    vinInfo: {
      vin: "1HGCM82633A004352",
      make: "Honda",
      model: "Accord",
      year: 2020,
      fuelType: "gasoline" as const,
    },
    inspectionScope: {
      country: "usa" as const,
      state: "CA",
      companies: ["uber", "lyft"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
      voltageGreaterThan12_1V: true,
    },
    uploadFields: {
      registrationCardPhoto: {
        name: "card.jpg",
        status: "done" as const,
        progress: 100,
        publicUrl: "https://rideshareinspection.b-cdn.net/abc123",
      },
      hornVideo: {
        name: "horn.mp4",
        status: "done" as const,
        progress: 100,
        publicUrl: "https://rideshareinspection.b-cdn.net/def456",
      },
    },
    reviewAgreement: { userAgreement: true as const, inspectionAgreement: true as const },
  };
}

describe("createInspectionDraft", () => {
  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createInspectionDraft({} as InspectionFormData)).rejects.toThrow("Unauthorized");
  });

  it("throws if vehicleInfo is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.vehicleInfo = null;

    await expect(createInspectionDraft(data)).rejects.toThrow(
      "Required form data missing",
    );
  });

  it("throws if vinInfo is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.vinInfo = null;

    await expect(createInspectionDraft(data)).rejects.toThrow(
      "Required form data missing",
    );
  });

  it("throws if inspectionScope is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.inspectionScope = null;

    await expect(createInspectionDraft(data)).rejects.toThrow(
      "Required form data missing",
    );
  });

  it("creates inspection draft and returns inspectionId", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            createInspection: {
              inspection: {
                id: "cG9zdDoxMjM=",
                databaseId: 123,
              },
            },
          },
        }),
    });

    const result = await createInspectionDraft(makeValidFormData());

    expect(result.inspectionId).toBe("123");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe(process.env.WORDPRESS_GRAPHQL_URL);
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    expect(callArgs[1].headers["Authorization"]).toBe("Bearer test-token");
  });

  it("includes file URLs in the mutation payload", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("CreateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                createInspection: {
                  inspection: { id: "cG9zdDoxMjM=", databaseId: 456 },
                },
              },
            }),
        };
      },
    );

    const result = await createInspectionDraft(makeValidFormData());

    expect(result.inspectionId).toBe("456");

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.registrationCardPhoto).toBe("https://rideshareinspection.b-cdn.net/abc123");
    expect(details.hornVideo).toBe("https://rideshareinspection.b-cdn.net/def456");
    expect(details.fuelType).toBe("gasoline");
  });

  it("handles Canada scope correctly", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("CreateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                createInspection: {
                  inspection: { id: "cG9zdDo3ODk=", databaseId: 789 },
                },
              },
            }),
        };
      },
    );

    const data = makeValidFormData();
    data.inspectionScope = {
      country: "canada" as const,
      state: "ON",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
      voltageGreaterThan12_1V: true,
    };

    const result = await createInspectionDraft(data);

    expect(result.inspectionId).toBe("789");

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.inspectionCountry).toBe("CANADA");
    expect(details.inspectionStateCanada).toBe("ON");
    expect(details.inspectionStateUsa).toBe("");
    expect(details.inspectionCompanies).toBe("turo");
    expect(details.fuelType).toBe("gasoline");
    expect(details.tiresOlderThan6Years).toBe("true");
    expect(details.batteryOlderThan5Years).toBe("true");
    expect(details.voltageGreaterThan12_1V).toBe("true");
    expect(details.userAgreement).toBe("true");
    expect(details.inspectionAgreement).toBe("true");
  });

  it("throws when WPGraphQL returns errors", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Field 'unknownField' not found" }],
        }),
    });

    await expect(createInspectionDraft(makeValidFormData())).rejects.toThrow(
      "Field 'unknownField' not found",
    );
  });

  it("includes pricing in the mutation payload", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("CreateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                createInspection: {
                  inspection: { id: "cG9zdDoxMjM=", databaseId: 111 },
                },
              },
            }),
        };
      },
    );

    const data = makeValidFormData();
    data.inspectionScope.companies = ["uber", "lyft", "turo"];

    await createInspectionDraft(data);

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.orderSubtotal).toBe("63");
    expect(details.paymentStatus).toBe("pending");
    expect(details.inspectionStatus).toBe("pending");
    expect(details.fuelType).toBe("gasoline");
    expect(details.tiresOlderThan6Years).toBe("true");
    expect(details.batteryOlderThan5Years).toBe("true");
    expect(details.voltageGreaterThan12_1V).toBe("true");
    expect(details.userAgreement).toBe("true");
    expect(details.inspectionAgreement).toBe("true");
  });
});

describe("submitReInspection", () => {
  const mockUpdateResponse = {
    updateInspection: {
      inspection: { id: "cG9zdDo3ODk=", databaseId: 789 },
    },
  };

  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(
      submitReInspection("789", {} as InspectionFormData, "data:image/png;base64,abc"),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws if wpId is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "test-token" },
    });

    await expect(
      submitReInspection("789", {} as InspectionFormData, "data:image/png;base64,abc"),
    ).rejects.toThrow("User not authenticated properly");
  });

  it("throws if vehicleInfo is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.vehicleInfo = null;

    await expect(
      submitReInspection("789", data, "data:image/png;base64,abc"),
    ).rejects.toThrow("Required form data missing");
  });

  it("throws if vinInfo is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.vinInfo = null;

    await expect(
      submitReInspection("789", data, "data:image/png;base64,abc"),
    ).rejects.toThrow("Required form data missing");
  });

  it("throws if inspectionScope is missing", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    const data = makeValidFormData();
    data.inspectionScope = null;

    await expect(
      submitReInspection("789", data, "data:image/png;base64,abc"),
    ).rejects.toThrow("Required form data missing");
  });

  it("submits re-inspection with correct mutation fields", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("UpdateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockUpdateResponse,
            }),
        };
      },
    );

    const data = makeValidFormData();
    await submitReInspection("789", data, "data:image/png;base64,abc");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(capturedBody).toBeDefined();

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.inspectionStatus).toBe("in_progress");
    expect(details.licensePlateNumber).toBe("ABC123");
    expect(details.vehicleMileage).toBe("50000");
    expect(details.vin).toBe("1HGCM82633A004352");
    expect(details.vehicleMake).toBe("Honda");
    expect(details.vehicleModel).toBe("Accord");
    expect(details.vehicleYear).toBe("2020");
    expect(details.fuelType).toBe("gasoline");
    expect(details.inspectionCountry).toBe("USA");
    expect(details.inspectionStateUsa).toBe("CA");
    expect(details.inspectionStateCanada).toBe("");
    expect(details.inspectionCompanies).toBe("uber, lyft");
    expect(details.tiresOlderThan6Years).toBe("true");
    expect(details.batteryOlderThan5Years).toBe("true");
    expect(details.voltageGreaterThan12_1V).toBe("true");
    expect(details.userAgreement).toBe("true");
    expect(details.inspectionAgreement).toBe("true");
    expect(details.hostSignature).toBe("data:image/png;base64,abc");
    expect(details.hostName).toBe("Test User");
    expect(details.hostEmail).toBe("test@example.com");
    expect(details.hostPhoneNumber).toBe("+1234567890");
  });

  it("does not change paymentStatus during re-inspection", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("UpdateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockUpdateResponse,
            }),
        };
      },
    );

    await submitReInspection(
      "789",
      makeValidFormData(),
      "data:image/png;base64,abc",
    );

    const details = capturedBody!.variables.input.inspectionDetails;
    // Re-inspection should NOT include paymentStatus - WP preserves existing value
    expect(details.paymentStatus).toBeUndefined();
  });

  it("includes file URLs from uploadFields", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("UpdateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockUpdateResponse,
            }),
        };
      },
    );

    const data = makeValidFormData();
    data.uploadFields = {
      registrationCardPhoto: {
        name: "card.jpg",
        status: "done" as const,
        progress: 100,
        publicUrl: "https://rideshareinspection.b-cdn.net/new1",
      },
    };

    await submitReInspection("789", data, "data:image/png;base64,abc");

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.registrationCardPhoto).toBe(
      "https://rideshareinspection.b-cdn.net/new1",
    );
  });

  it("handles Canada scope correctly", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    let capturedBody: GraphQLBody | undefined;
    mockFetch.mockImplementation(
      async (_url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (body.query.includes("UpdateInspection")) {
          capturedBody = body;
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockUpdateResponse,
            }),
        };
      },
    );

    const data = makeValidFormData();
    data.inspectionScope = {
      country: "canada" as const,
      state: "ON",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
      voltageGreaterThan12_1V: true,
    };

    await submitReInspection("789", data, "data:image/png;base64,abc");

    const details = capturedBody!.variables.input.inspectionDetails;
    expect(details.inspectionCountry).toBe("CANADA");
    expect(details.inspectionStateCanada).toBe("ON");
    expect(details.inspectionStateUsa).toBe("");
    expect(details.inspectionCompanies).toBe("turo");
  });

  it("throws when WPGraphQL returns errors", async () => {
    mockAuth.mockResolvedValue(makeMockSession());

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Update failed" }],
        }),
    });

    await expect(
      submitReInspection("789", makeValidFormData(), "data:image/png;base64,abc"),
    ).rejects.toThrow("Update failed");
  });
});