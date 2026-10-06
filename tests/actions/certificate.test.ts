import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to create mocks at the top level (hoisted by vitest)
const mockRenderCertificate = vi.hoisted(() => vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])));
const mockFetchInspection = vi.hoisted(() => vi.fn());
const mockAuth = vi.hoisted(() => vi.fn());
const mockAssertSessionActive = vi.hoisted(() => vi.fn());
const mockBuildCertificateData = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/inspections", () => ({
  fetchInspection: mockFetchInspection,
  listInspections: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/app/lib/refresh-token", () => ({
  assertSessionActive: mockAssertSessionActive,
}));

vi.mock("@/app/lib/pdf/data", () => ({
  buildCertificateData: mockBuildCertificateData,
}));

vi.mock("@/app/lib/pdf/engine", () => ({
  renderCertificate: mockRenderCertificate,
}));

import { generateCertificate } from "@/app/actions/certificate";
import type { InspectionDetail } from "@/app/lib/types";
import type { CertificateData } from "@/app/lib/pdf/types";

describe("generateCertificate", () => {
  const mockDetail: InspectionDetail = {
    databaseId: 123,
    id: "node123",
    licensePlateNumber: "ABC123",
    vehicleMileage: "15000",
    tncLicesnePlatesLast4Digit: "1234",
    vin: "1HGBH41JXMN109186",
    vehicleMake: "Toyota",
    vehicleModel: "Prius",
    vehicleYear: "2022",
    vehicleColor: "Blue",
    fuelType: "hybrid",
    inspectionCountry: "USA",
    country: "USA",
    state: "CA",
    inspectionDate: "2026-10-06",
    expiryDate: "2027-10-06",
    hostName: "Rideshare Inspection",
    hostEmail: "certs@ride.com",
    hostPhoneNumber: "+15550000",
    driverName: "John Doe",
    driverEmail: "john@example.com",
    driverPhoneNumber: "+15550100",
    media: { general: [], interior: [], exterior: [], tires: [] },
    certificates: {},
    orderSubtotal: "24.00",
    companies: ["lyft"],
    inspectionStatus: "approved",
    paymentStatus: "paid",
    approvalFields: {},
  } as InspectionDetail;

  const mockCertData = {
    company: "lyft",
    country: "USA" as const,
    state: "CA",
    driver: { name: "John Doe", email: "john@example.com" },
    host: { name: "Rideshare Inspection", email: "certs@ride.com", phone: "555-0100" },
    vehicle: { make: "Toyota", model: "Prius", year: "2022", color: "Blue", mileage: "15000", vin: "1HGBH41JXMN109186", doors: "4", seatbelts: "5", fuelType: "hybrid" },
    registration: { licensePlate: "ABC123", tncLast4: "1234", hasSticker: "pass" as const, stickerMonthYear: "01/26", zip: "90001" },
    condition: { tiresOlderThan6Years: "no" as const, batteryOlderThan5Years: "no" as const, voltageGreaterThan12_1V: "yes" as const },
    brakes: { minFront: "0.00", minRear: "0.00", frontLeft: "pass" as const, frontRight: "pass" as const, rearLeft: "pass" as const, rearRight: "pass" as const },
    tires: { rightFront: "0/32", leftFront: "0/32", rightRear: "0/32", leftRear: "0/32" },
    inspection: { date: "10/06/2026", expiryDate: "10/06/2027", companiesLabel: "Lyft" },
    handler: { name: "Inspector Smith", signature: "inspector-signature-id" },
    arn: "ARD-00000002",
    facility: { name: "RideShare Inspection Center", address: "1234 Inspection Blvd, Los Angeles, CA 90001" },
  } as CertificateData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { accessToken: "token", role: "administrator" } });
    mockFetchInspection.mockResolvedValue(mockDetail);
    mockBuildCertificateData.mockReturnValue(mockCertData);
    mockRenderCertificate.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it("should render certificate for admin user", async () => {
    const result = await generateCertificate("123");

    expect(result.mimeType).toBe("application/pdf");
    expect(result.previewUrl).toContain("data:application/pdf;base64,");
    expect(mockFetchInspection).toHaveBeenCalledWith("123");
    expect(mockRenderCertificate).toHaveBeenCalledWith(mockCertData, expect.any(Number));
    expect(mockBuildCertificateData).toHaveBeenCalledWith(mockDetail, "lyft", {});
  });

  it("should render certificate for inspector user", async () => {
    mockAuth.mockResolvedValue({ user: { accessToken: "token", role: "inspector" } });

    const result = await generateCertificate("123");

    expect(result.mimeType).toBe("application/pdf");
  });

  it("should reject customer user", async () => {
    mockAuth.mockResolvedValue({
      user: { accessToken: "token", role: "customer" },
    });

    await expect(generateCertificate("123")).rejects.toThrow("Forbidden");
  });

  it("should reject unauthenticated user", async () => {
    mockAuth.mockResolvedValue({ user: null });

    await expect(generateCertificate("123")).rejects.toThrow("Unauthorized");
  });

  it("should use company from input parameter", async () => {
    const uberDetail = { ...mockDetail, companies: ["uber", "lyft"] };
    mockFetchInspection.mockResolvedValue(uberDetail);

    await generateCertificate("123", { company: "uber" });

    expect(mockBuildCertificateData).toHaveBeenCalledWith(uberDetail, "uber", {});
  });

  it("should use first company from inspection if not specified", async () => {
    const uberLyftDetail = { ...mockDetail, companies: ["uber", "lyft"] };
    mockFetchInspection.mockResolvedValue(uberLyftDetail);

    await generateCertificate("123");

    expect(mockBuildCertificateData).toHaveBeenCalledWith(uberLyftDetail, "uber", {});
  });

  it("should pass seed to engine", async () => {
    await generateCertificate("123", { seed: 42 });

    expect(mockRenderCertificate).toHaveBeenCalledWith(
      mockCertData,
      42,
    );
  });

  it("should return correct content disposition", async () => {
    const result = await generateCertificate("123");

    expect(result.contentDisposition).toContain("certificate-123.pdf");
  });
});