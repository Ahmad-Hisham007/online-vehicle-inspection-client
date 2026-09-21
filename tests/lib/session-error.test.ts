import { describe, it, expect } from "vitest";
import {
  REFRESH_ACCESS_TOKEN_ERROR,
  isRefreshAccessTokenError,
  shouldForceSignOut,
  shouldMarkSessionExpired,
} from "@/app/lib/session-error";
import {
  assertSessionActive,
  SessionExpiredError,
} from "@/app/lib/refresh-token";

describe("session-error", () => {
  it("exposes the NextAuth refresh error constant", () => {
    expect(REFRESH_ACCESS_TOKEN_ERROR).toBe("RefreshAccessTokenError");
  });

  it("detects the refresh error flag", () => {
    expect(isRefreshAccessTokenError(REFRESH_ACCESS_TOKEN_ERROR)).toBe(true);
    expect(isRefreshAccessTokenError(undefined)).toBe(false);
    expect(isRefreshAccessTokenError("some-other-error")).toBe(false);
  });

  it("marks the session expired only when WordPress was reached", () => {
    expect(
      shouldMarkSessionExpired({ success: false, serverReached: true }),
    ).toBe(true);
    expect(
      shouldMarkSessionExpired({ success: false, serverReached: false }),
    ).toBe(false);
    expect(
      shouldMarkSessionExpired({ success: true, serverReached: true }),
    ).toBe(false);
  });

  describe("shouldForceSignOut", () => {
    it("forces sign-out for a rejected refresh token off the login page", () => {
      expect(
        shouldForceSignOut("/dashboard/customer", REFRESH_ACCESS_TOKEN_ERROR),
      ).toBe(true);
    });

    it("never forces sign-out on the login page", () => {
      expect(
        shouldForceSignOut("/login", REFRESH_ACCESS_TOKEN_ERROR),
      ).toBe(false);
      expect(
        shouldForceSignOut("/login?expired=1", REFRESH_ACCESS_TOKEN_ERROR),
      ).toBe(false);
    });

    it("ignores healthy sessions and unrelated errors", () => {
      expect(shouldForceSignOut("/dashboard/customer", undefined)).toBe(false);
      expect(
        shouldForceSignOut("/dashboard/customer", "some-other-error"),
      ).toBe(false);
    });
  });

  describe("assertSessionActive", () => {
    it("throws SessionExpiredError when the session is flagged", () => {
      expect(() => assertSessionActive(REFRESH_ACCESS_TOKEN_ERROR)).toThrow(
        SessionExpiredError,
      );
    });

    it("does nothing for a healthy session", () => {
      expect(() => assertSessionActive(undefined)).not.toThrow();
    });
  });
});
