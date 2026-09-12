import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockWpFetch = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/app/lib/wp-auth", () => ({
  wpFetch: mockWpFetch,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { listInspections, fetchInspection } from "@/app/actions/inspections";
import { SessionExpiredError } from "@/app/lib/refresh-token";

const SESSION = {
  user: {
    wpId: 11,
    accessToken: "test-token",
    refreshToken: "test-refresh",
    refreshTokenExpiration: Date.now() + 3600000,
    accessTokenExpiration: Math.floor((Date.now() + 3600000) / 1000),
    name: "Test User",
    email: "test@example.com",
  },
};

function listNode(id: number, overrides: Record<string, unknown> = {}) {
  return {
    databaseId: id,
    title: `Inspection #${id}`,
    date: "2026-08-15T17:14:00",
    inspectionDetails: {
      licensePlateNumber: `PLATE-${id}`,
      inspectionStatus: "pending",
      paymentStatus: "pending",
      ...overrides,
    },
  };
}

function detailNode(id: number, overrides: Record<string, unknown> = {}) {
  return {
    databaseId: id,
    title: `Inspection #${id}`,
    date: "2026-08-15T17:14:00",
    author: { node: { databaseId: 11, name: "Test User", email: "test@example.com" } },
    inspectionDetails: {
      licensePlateNumber: "ABC123",
      vin: "1HGCM82633A004352",
      vehicleMake: "Honda",
      vehicleModel: "Accord",
      vehicleYear: "2020",
      vehicleColor: "Silver",
      vehicleMileage: "50000",
      fuelType: "gasoline",
      inspectionCountry: "USA",
      inspectionStateUsa: "AR",
      inspectionStateCanada: "",
      inspectionCompanies: "uber, lyft",
      inspectionDate: "2026-08-15",
      expiryDate: "",
      hostName: "Test User",
      hostEmail: "test@example.com",
      hostPhoneNumber: "555-0100",
      orderSubtotal: "63",
      inspectionStatus: "pending",
      paymentStatus: "pending",
      registrationCardPhoto: "https://rideshareinspection.b-cdn.net/reg",
      odometerPhoto: "https://rideshareinspection.b-cdn.net/odo",
      hornVideo: "https://rideshareinspection.b-cdn.net/horn",
      interiorDriverSidePhoto: "",
      driverSeatAdjustmentPhoto: "",
      interiorPassengerSidePhoto: "",
      passengerSeatAdjustmentPhoto: "",
      interiorBackseatPhoto: "",
      exteriorLeftPhoto: "https://rideshareinspection.b-cdn.net/ext-left",
      exteriorRightPhoto: "",
      exteriorFrontVideo: "",
      exteriorRearVideo: "",
      leftFrontTirePhoto: "https://rideshareinspection.b-cdn.net/tire-lf",
      rightFrontTirePhoto: "",
      leftRearTirePhoto: "",
      rightRearTirePhoto: "",
      lyftCertificate: "",
      uberCertificate: "https://rideshareinspection.b-cdn.net/cert-uber",
      turoCertificate: "",
      ...overrides,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listInspections", () => {
  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listInspections()).rejects.toThrow("Unauthorized");
  });

  it("fails fast with SessionExpiredError when the session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(listInspections()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("fetches a single page and returns the mapped summaries and total", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: {
        nodes: [listNode(1), listNode(2)],
        pageInfo: { total: 2 },
      },
    });

    const result = await listInspections();

    expect(result.items).toEqual([
      {
        id: "1",
        licensePlate: "PLATE-1",
        dateCreated: "2026-08-15T17:14:00",
        inspectionStatus: "pending",
        paymentStatus: "pending",
      },
      {
        id: "2",
        licensePlate: "PLATE-2",
        dateCreated: "2026-08-15T17:14:00",
        inspectionStatus: "pending",
        paymentStatus: "pending",
      },
    ]);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(8);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);

    expect(mockWpFetch).toHaveBeenCalledTimes(1);
    const [query, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(query).toContain("ListMyInspections");
    expect(query).toContain("inspectionStatus: $inspectionStatus");
    expect(query).toContain("limit: $limit");
    expect(query).toContain("offset: $offset");
    expect(query).toContain("pageInfo {\n        total\n      }");
    expect(variables).toEqual({
      author: 11,
      inspectionStatus: null,
      order: "DESC",
      limit: 8,
      offset: 0,
    });
  });

  it("passes the status filter to the query", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: { nodes: [], pageInfo: { total: 0 } },
    });

    await listInspections({ status: "paid" });

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.inspectionStatus).toBe("paid");
  });

  it("sorts oldest first and pages via offset", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: { nodes: [], pageInfo: { total: 20 } },
    });

    const result = await listInspections({ sortDir: "oldest", page: 2 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables).toEqual({
      author: 11,
      inspectionStatus: null,
      order: "ASC",
      limit: 8,
      offset: 8,
    });
  });

  it("clamps the page when it exceeds the total", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: { nodes: [listNode(1)], pageInfo: { total: 1 } },
    });

    const result = await listInspections({ page: 5 });

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it("normalizes ACF select array values to a single string", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: {
        nodes: [
          listNode(1, {
            inspectionStatus: ["paid"],
            paymentStatus: ["succeeded"],
          }),
        ],
        pageInfo: { total: 1 },
      },
    });

    const result = await listInspections();

    expect(result.items[0]).toMatchObject({
      inspectionStatus: "paid",
      paymentStatus: "succeeded",
    });
  });
});

describe("fetchInspection", () => {
  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(fetchInspection("1")).rejects.toThrow("Unauthorized");
  });

  it("fails fast with SessionExpiredError when the session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(fetchInspection("1")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when inspection is not found", async () => {
    mockWpFetch.mockResolvedValue({ inspection: null });

    await expect(fetchInspection("999")).rejects.toThrow("Inspection not found");
  });

  it("maps full detail with media grouping and companies", async () => {
    mockWpFetch.mockResolvedValue({ inspection: detailNode(1) });

    const result = await fetchInspection("1");

    expect(result.id).toBe("1");
    expect(result.licensePlate).toBe("ABC123");
    expect(result.vin).toBe("1HGCM82633A004352");
    expect(result.make).toBe("Honda");
    expect(result.companies).toEqual(["uber", "lyft"]);
    expect(result.location).toEqual({ country: "USA", state: "AR" });
    expect(result.certificates).toEqual({
      lyft: undefined,
      uber: "https://rideshareinspection.b-cdn.net/cert-uber",
      turo: undefined,
    });

    expect(result.media.general.map((m) => m.url)).toEqual([
      "https://rideshareinspection.b-cdn.net/reg",
      "https://rideshareinspection.b-cdn.net/odo",
      "https://rideshareinspection.b-cdn.net/horn",
    ]);
    expect(result.media.general[2].type).toBe("video");
    expect(result.media.exterior.map((m) => m.url)).toEqual([
      "https://rideshareinspection.b-cdn.net/ext-left",
    ]);
    expect(result.media.tires.map((m) => m.url)).toEqual([
      "https://rideshareinspection.b-cdn.net/tire-lf",
    ]);
    expect(result.media.interior).toEqual([]);
  });

  it("parses empty companies to empty array", async () => {
    mockWpFetch.mockResolvedValue({
      inspection: detailNode(1, { inspectionCompanies: "" }),
    });

    const result = await fetchInspection("1");
    expect(result.companies).toEqual([]);
  });
});
