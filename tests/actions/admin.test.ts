import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockWpFetch = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/app/lib/wp-auth", () => ({ wpFetch: mockWpFetch }));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag, revalidatePath: mockRevalidatePath }));

import { rejectInspection, returnInspection, approveInspection } from "@/app/actions/admin";
import { SessionExpiredError } from "@/app/lib/refresh-token";

const ADMIN_SESSION = {
  user: {
    wpId: 1,
    role: "administrator",
    accessToken: "token",
    name: "Admin",
    email: "admin@example.com",
  },
};

const INSPECTOR_SESSION = {
  user: { ...ADMIN_SESSION.user, wpId: 13, role: "inspector" },
};

const CUSTOMER_SESSION = {
  user: { ...ADMIN_SESSION.user, wpId: 20, role: "customer" },
};

const OK_RESPONSE = {
  updateInspection: { inspection: { databaseId: 234 } },
};

const REJECTION_DATA = {
  invalidFields: ["licensePlate", "vin"],
  rejectionReason: "Vehicle does not match the VIN on the registration.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rejectInspection", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(rejectInspection("234", "1", REJECTION_DATA)).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is not staff", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(rejectInspection("234", "1", REJECTION_DATA)).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("fails fast when the session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...ADMIN_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(rejectInspection("234", "1", REJECTION_DATA)).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an administrator to reject", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(rejectInspection("234", "1", REJECTION_DATA)).resolves.toBeUndefined();
  });

  it("allows an inspector to reject", async () => {
    mockAuth.mockResolvedValue(INSPECTOR_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(rejectInspection("234", "1", REJECTION_DATA)).resolves.toBeUndefined();
  });

  it("sends the rejected status and revalidates caches", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await rejectInspection("234", "1", REJECTION_DATA);

    expect(mockWpFetch).toHaveBeenCalledTimes(1);
    const [query, variables, options] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
      Record<string, unknown> | undefined,
    ];
    expect(query).toContain("updateInspection");
    expect(variables).toEqual({
      input: {
        id: "234",
        inspectionDetails: {
          inspectionStatus: "rejected",
          invalidFields: "<ul><li>License plate</li><li>VIN</li></ul>",
          rejectionReason: "Vehicle does not match the VIN on the registration.",
        },
      },
    });
    expect(options).toBeUndefined();
  });

  it("trims the rejection reason and ignores unknown field values", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await rejectInspection("234", "1", {
      invalidFields: ["bogusField", "horn"],
      rejectionReason: "   Fix the horn   ",
    });

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables).toEqual({
      input: {
        id: "234",
        inspectionDetails: {
          inspectionStatus: "rejected",
          invalidFields: "<ul><li>Horn</li></ul>",
          rejectionReason: "Fix the horn",
        },
      },
    });
  });

  it("throws when no valid invalid field is provided", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    await expect(
      rejectInspection("234", "1", {
        invalidFields: [],
        rejectionReason: "Reason",
      }),
    ).rejects.toThrow("At least one invalid field is required");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the rejection reason is blank", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    await expect(
      rejectInspection("234", "1", {
        invalidFields: ["horn"],
        rejectionReason: "   ",
      }),
    ).rejects.toThrow("Rejection reason is required");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("revalidates the affected list tags including owner's list", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await rejectInspection("234", "1", REJECTION_DATA);

    expect(mockRevalidateTag).toHaveBeenCalledWith("request-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("archive-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("inspection:234", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "inspection-list:author:1",
      "max"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/dashboard/admin/inspection/234"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/dashboard/customer/inspection/234"
    );
  });

  it("throws when the mutation returns no inspection", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ updateInspection: null });

    await expect(rejectInspection("234", "1", REJECTION_DATA)).rejects.toThrow(
      "Failed to reject inspection",
    );
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});

describe("returnInspection", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(returnInspection("234", "1")).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is not staff", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(returnInspection("234", "1")).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an administrator to return inspection to in_progress", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(returnInspection("234", "1")).resolves.toBeUndefined();
  });

  it("sends in_progress status and revalidates all caches", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await returnInspection("234", "1");

    expect(mockWpFetch).toHaveBeenCalledTimes(1);
    const [query, variables] = mockWpFetch.mock.calls[0];
    expect(query).toContain("updateInspection");
    expect(variables.input.inspectionDetails.inspectionStatus).toBe("in_progress");
    
    expect(mockRevalidateTag).toHaveBeenCalledWith("request-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("archive-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("inspection:234", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "inspection-list:author:1",
      "max"
    );
  });

  it("throws when the mutation fails", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ updateInspection: null });

    await expect(returnInspection("234", "1")).rejects.toThrow(
      "Failed to reject inspection"
    );
  });
});

describe("approveInspection", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(approveInspection("234", "1", {
      mergedOverrides: {},
      certificates: {},
    })).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is not staff", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(approveInspection("234", "1", {
      mergedOverrides: {},
      certificates: {},
    })).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an administrator to approve with certificates", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(approveInspection("234", "1", {
      mergedOverrides: { inspectionStatus: "approved" },
      certificates: { lyft: "https://example.com/cert.pdf" },
    })).resolves.toBeUndefined();
  });

  it("sends approved status, certificates, and assignedInspector", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await approveInspection("234", "1", {
      mergedOverrides: { inspectionStatus: "approved" },
      certificates: { lyft: "https://example.com/lyft.pdf" },
    });

    expect(mockWpFetch).toHaveBeenCalledTimes(1);
    const [query, variables] = mockWpFetch.mock.calls[0];
    expect(query).toContain("updateInspection");
    expect(variables.input.inspectionDetails.inspectionStatus).toBe("approved");
    expect(variables.input.inspectionDetails.lyftCertificate).toBe("https://example.com/lyft.pdf");
    expect(variables.input.assignedInspector).toBe(1);
  });

  it("updates expiry date for certificates", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await approveInspection("234", "1", {
      mergedOverrides: {},
      certificates: { 
        lyft: "https://example.com/lyft.pdf",
        uber: "https://example.com/uber.pdf",
      },
    });

    // Verify expiry date is set
    const variables = mockWpFetch.mock.calls[0][1] as {
      input: { inspectionDetails: { expiryDate: string } };
    };
    expect(variables.input.inspectionDetails.expiryDate).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });

  it("revalidates all relevant caches after approval", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await approveInspection("234", "1", {
      mergedOverrides: { inspectionStatus: "approved" },
      certificates: {},
    });

    expect(mockRevalidateTag).toHaveBeenCalledWith("request-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("archive-admin", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("inspection:234", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "inspection-list:author:1",
      "max"
    );
  });
});