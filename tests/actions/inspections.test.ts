import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockWpFetch = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/app/lib/wp-auth", () => ({
  wpFetch: mockWpFetch,
}));

import { listInspections, fetchInspection } from "@/app/actions/inspections";

const SESSION = {
  user: {
    wpId: 42,
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
    author: { node: { databaseId: 42, displayName: "Test User" } },
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
    author: { node: { databaseId: 42, name: "Test User", email: "test@example.com" } },
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
      registrationCardPhoto: "https://ucarecdn.com/reg",
      odometerPhoto: "https://ucarecdn.com/odo",
      hornVideo: "https://ucarecdn.com/horn",
      interiorDriverSidePhoto: "",
      driverSeatAdjustmentPhoto: "",
      interiorPassengerSidePhoto: "",
      passengerSeatAdjustmentPhoto: "",
      interiorBackseatPhoto: "",
      exteriorLeftPhoto: "https://ucarecdn.com/ext-left",
      exteriorRightPhoto: "",
      exteriorFrontVideo: "",
      exteriorRearVideo: "",
      leftFrontTirePhoto: "https://ucarecdn.com/tire-lf",
      rightFrontTirePhoto: "",
      leftRearTirePhoto: "",
      rightRearTirePhoto: "",
      lyftCertificate: "",
      uberCertificate: "https://ucarecdn.com/cert-uber",
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

  it("returns mapped summaries for owned inspections", async () => {
    mockWpFetch.mockResolvedValue({
      inspections: { nodes: [listNode(1), listNode(2)] },
    });

    const result = await listInspections();

    expect(result).toEqual([
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
    expect(mockWpFetch).toHaveBeenCalledWith(
      expect.stringContaining("ListMyInspections"),
      { author: 42 },
    );
  });

  it("returns empty array when no inspections exist", async () => {
    mockWpFetch.mockResolvedValue({ inspections: { nodes: [] } });

    await expect(listInspections()).resolves.toEqual([]);
  });
});

describe("fetchInspection", () => {
  it("throws if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(fetchInspection("1")).rejects.toThrow("Unauthorized");
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
      uber: "https://ucarecdn.com/cert-uber",
      turo: undefined,
    });

    expect(result.media.general.map((m) => m.url)).toEqual([
      "https://ucarecdn.com/reg",
      "https://ucarecdn.com/odo",
      "https://ucarecdn.com/horn",
    ]);
    expect(result.media.general[2].type).toBe("video");
    expect(result.media.exterior.map((m) => m.url)).toEqual([
      "https://ucarecdn.com/ext-left",
    ]);
    expect(result.media.tires.map((m) => m.url)).toEqual([
      "https://ucarecdn.com/tire-lf",
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