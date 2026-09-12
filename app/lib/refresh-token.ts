import { WP_SITE_TOKEN_HEADER } from "./wp-headers";
import { SITE_ORIGIN } from "./site-origin";
import { isRefreshAccessTokenError } from "./session-error";

/**
 * Raised when the stored refresh token is definitively rejected by WordPress
 * (server reachable, but the mutation reported failure). Client code maps this
 * to a branded "session expired" message and a forced sign-out.
 */
export class SessionExpiredError extends Error {
  code = "SESSION_EXPIRED";

  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof SessionExpiredError;
}

/**
 * Throws `SessionExpiredError` when the session already carries the
 * refresh-access-token error, so server actions fail fast instead of sending a
 * dead token to WordPress.
 */
export function assertSessionActive(error: unknown): void {
  if (isRefreshAccessTokenError(error)) {
    throw new SessionExpiredError("Session expired. Please sign in again.");
  }
}

interface RefreshTokenPayload {
  data?: {
    refreshToken?: {
      authToken?: string | null;
      authTokenExpiration?: string | null;
      success?: boolean | null;
    } | null;
  } | null;
  errors?: { message: string }[] | null;
}

export interface RefreshTokenResult {
  success: boolean;
  /** False when the request itself failed (network / non-JSON / server not reached). */
  serverReached: boolean;
  reason?: string;
  authToken?: string;
  authTokenExpiration?: string | null;
}

const REFRESH_MUTATION = `
  mutation RefreshAuthToken($token: String!) {
    refreshToken(input: { refreshToken: $token }) {
      authToken
      authTokenExpiration
      success
    }
  }
`;

/**
 * Single source of truth for exchanging a refresh token for a fresh WP access
 * token. Used by BOTH the NextAuth jwt callback and getValidAccessToken() so
 * the query shape can never drift apart again.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshTokenResult> {
  let res: Response;
  try {
    res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: REFRESH_MUTATION,
        variables: { token: refreshToken },
      }),
    });
  } catch (error) {
    return {
      success: false,
      serverReached: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  let json: RefreshTokenPayload;
  try {
    json = (await res.json()) as RefreshTokenPayload;
  } catch {
    return {
      success: false,
      serverReached: false,
      reason: `Non-JSON response (HTTP ${res.status})`,
    };
  }

  const payload = json.data?.refreshToken;

  if (!payload || !payload.success || !payload.authToken) {
    const reason =
      json.errors?.[0]?.message ??
      "refreshToken mutation returned success=false or no authToken";
    console.error(
      "[TOKEN-REFRESH-FAILED]",
      JSON.stringify({ reason, httpStatus: res.status }),
    );
    return { success: false, serverReached: true, reason };
  }

  return {
    success: true,
    serverReached: true,
    authToken: payload.authToken,
    authTokenExpiration: payload.authTokenExpiration ?? null,
  };
}
