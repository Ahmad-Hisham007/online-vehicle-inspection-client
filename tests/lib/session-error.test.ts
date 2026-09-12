import { describe, it, expect } from "vitest";
import {
  REFRESH_ACCESS_TOKEN_ERROR,
  isRefreshAccessTokenError,
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
