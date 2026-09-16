import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockWpFetch = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/app/lib/wp-auth", () => ({ wpFetch: mockWpFetch }));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));

import { rejectInspection } from "@/app/actions/admin";
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rejectInspection", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(rejectInspection("234")).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is not staff", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(rejectInspection("234")).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("fails fast when the session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...ADMIN_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(rejectInspection("234")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an administrator to reject", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(rejectInspection("234")).resolves.toBeUndefined();
  });

  it("allows an inspector to reject", async () => {
    mockAuth.mockResolvedValue(INSPECTOR_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await expect(rejectInspection("234")).resolves.toBeUndefined();
  });

  it("sends the rejected status and no explicit token", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await rejectInspection("234");

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
        inspectionDetails: { inspectionStatus: "rejected" },
      },
    });
    expect(options).toBeUndefined();
  });

  it("revalidates the affected list tags", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(OK_RESPONSE);

    await rejectInspection("234");

    expect(mockRevalidateTag).toHaveBeenCalledWith("requests", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("archive", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("inspections", "max");
  });

  it("throws when the mutation returns no inspection", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ updateInspection: null });

    await expect(rejectInspection("234")).rejects.toThrow(
      "Failed to reject inspection",
    );
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});