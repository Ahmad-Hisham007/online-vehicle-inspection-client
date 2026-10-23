import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockWpFetch = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/app/lib/wp-auth", () => ({ wpFetch: mockWpFetch }));
vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
  revalidatePath: mockRevalidatePath,
  unstable_cache: vi.fn((fn) => fn),
}));

import {
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserPassword,
  updateUserSignature,
} from "@/app/actions/users";
import { SessionExpiredError } from "@/app/lib/refresh-token";

const STAFF_SESSION = {
  user: {
    wpId: 13,
    role: "inspector",
    accessToken: "token-abc",
    name: "Inspector",
    email: "inspector@example.com",
  },
};

const ADMIN_SESSION = {
  user: {
    wpId: 1,
    role: "administrator",
    accessToken: "token-admin",
    name: "Admin",
    email: "admin@example.com",
  },
};

const CUSTOMER_SESSION = {
  user: {
    wpId: 20,
    role: "subscriber",
    accessToken: "token-cust",
    name: "Customer",
    email: "customer@example.com",
  },
};

const USER_NODE = {
  databaseId: 13,
  email: "inspector@example.com",
  firstName: "Inspector",
  lastName: "User",
  displayName: "Inspector User",
  registeredDate: "2025-03-15T10:00:00",
  roles: { nodes: [{ name: "inspector" }] },
  userFields: {
    phoneNumber: "555-0100",
    signature: "https://example.com/sig.png",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

describe("getCurrentUser", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(getCurrentUser("13")).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("fails fast when session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...ADMIN_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(getCurrentUser("13")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when user is not found", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ user: null });

    await expect(getCurrentUser("999")).rejects.toThrow("User not found");
  });

  it("returns mapped CurrentUser with signature", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ user: USER_NODE });

    const result = await getCurrentUser("13");

    expect(result).toEqual({
      displayName: "Inspector User",
      email: "inspector@example.com",
      firstName: "Inspector",
      lastName: "User",
      phone: "555-0100",
      signature: "https://example.com/sig.png",
      registeredDate: "2025-03-15T10:00:00",
    });
  });

  it("defaults signature to empty string when missing", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({
      user: { ...USER_NODE, userFields: { phoneNumber: null, signature: null } },
    });

    const result = await getCurrentUser("13");

    expect(result.signature).toBe("");
    expect(result.phone).toBe("");
  });
});

// ---------------------------------------------------------------------------
// updateCurrentUser
// ---------------------------------------------------------------------------

const UPDATE_USER_OK = { updateUser: { user: { databaseId: 13 } } };

describe("updateCurrentUser", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(
      updateCurrentUser({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "555-0000",
      }),
    ).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...STAFF_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(
      updateCurrentUser({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "555-0000",
      }),
    ).rejects.toBeInstanceOf(SessionExpiredError);
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is a customer (not staff)", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(
      updateCurrentUser({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "",
      }),
    ).rejects.toThrow("Unauthorized");
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an inspector to update their own profile", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await expect(
      updateCurrentUser({
        firstName: "Updated",
        lastName: "Name",
        email: "new@example.com",
        phone: "555-9999",
      }),
    ).resolves.toBeUndefined();
  });

  it("sends firstName, lastName, email, phoneNumber to the mutation", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateCurrentUser({
      firstName: "Updated",
      lastName: "Name",
      email: "new@example.com",
      phone: "555-9999",
    });

    expect(mockWpFetch).toHaveBeenCalledTimes(1);
    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.input).toEqual({
      id: "13",
      email: "new@example.com",
      firstName: "Updated",
      lastName: "Name",
      phoneNumber: "555-9999",
    });
  });

  it("omits phoneNumber when phone is empty", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateCurrentUser({
      firstName: "Updated",
      lastName: "Name",
      email: "new@example.com",
      phone: "",
    });

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.input).not.toHaveProperty("phoneNumber");
  });

  it("revalidates users cache on success", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateCurrentUser({
      firstName: "Updated",
      lastName: "Name",
      email: "new@example.com",
      phone: "555-0000",
    });

    expect(mockRevalidateTag).toHaveBeenCalledWith("users", "max");
  });

  it("throws when mutation returns no user", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue({ updateUser: null });

    await expect(
      updateCurrentUser({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "555-0000",
      }),
    ).rejects.toThrow("Failed to update profile");
  });
});

// ---------------------------------------------------------------------------
// updateUserSignature
// ---------------------------------------------------------------------------

describe("updateUserSignature", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(updateUserSignature("https://example.com/sig.png")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...STAFF_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(updateUserSignature("https://example.com/sig.png")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when the user is a customer", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(updateUserSignature("https://example.com/sig.png")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an inspector to set a signature", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await expect(
      updateUserSignature("https://example.com/sig.png"),
    ).resolves.toBeUndefined();
  });

  it("sends signature field to the mutation", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateUserSignature("https://example.com/new-sig.png");

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.input).toEqual({
      id: "13",
      signature: "https://example.com/new-sig.png",
    });
  });

  it("sends empty string to clear the signature", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateUserSignature("");

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.input).toEqual({
      id: "13",
      signature: "",
    });
  });

  it("throws when mutation fails", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue({ updateUser: null });

    await expect(updateUserSignature("https://example.com/sig.png")).rejects.toThrow(
      "Failed to update signature",
    );
  });
});

// ---------------------------------------------------------------------------
// updateCurrentUserPassword
// ---------------------------------------------------------------------------

describe("updateCurrentUserPassword", () => {
  it("throws when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(updateCurrentUserPassword("newpass123")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when session is expired", async () => {
    mockAuth.mockResolvedValue({
      ...ADMIN_SESSION,
      error: "RefreshAccessTokenError",
    });

    await expect(updateCurrentUserPassword("newpass123")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("throws when a customer tries to change password", async () => {
    mockAuth.mockResolvedValue(CUSTOMER_SESSION);

    await expect(updateCurrentUserPassword("newpass123")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockWpFetch).not.toHaveBeenCalled();
  });

  it("allows an admin to change password", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await expect(
      updateCurrentUserPassword("newpass123"),
    ).resolves.toBeUndefined();
  });

  it("allows an inspector to change password", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await expect(
      updateCurrentUserPassword("newpass123"),
    ).resolves.toBeUndefined();
  });

  it("sends password to the mutation", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue(UPDATE_USER_OK);

    await updateCurrentUserPassword("newSecurePassword123");

    const [, variables] = mockWpFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(variables.input).toEqual({
      id: "1",
      password: "newSecurePassword123",
    });
  });

  it("throws when mutation fails", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockWpFetch.mockResolvedValue({ updateUser: null });

    await expect(updateCurrentUserPassword("newpass123")).rejects.toThrow(
      "Failed to update password",
    );
  });
});
