import type { RefreshTokenResult } from "./refresh-token";

/**
 * NextAuth convention: surfaced on `session.error` so the client can force a
 * sign-out when the WP refresh token is definitively rejected.
 */
export const REFRESH_ACCESS_TOKEN_ERROR = "RefreshAccessTokenError";

export function isRefreshAccessTokenError(error: unknown): boolean {
  return error === REFRESH_ACCESS_TOKEN_ERROR;
}

/**
 * A failed refresh is fatal only when WordPress was actually reached and
 * rejected the token. A transient/network failure must not sign the user out.
 */
export function shouldMarkSessionExpired(result: RefreshTokenResult): boolean {
  return !result.success && result.serverReached;
}
