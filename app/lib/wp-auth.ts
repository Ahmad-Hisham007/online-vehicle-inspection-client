import { auth } from "@/auth";
import { WP_SITE_TOKEN_HEADER } from "./wp-headers";

interface TokenUser {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiration: number;
  accessTokenExpiration?: number;
}

async function getSessionTokens(): Promise<TokenUser> {
  const session = await auth();
  const user = session?.user as TokenUser | undefined;

  if (!user?.accessToken || !user.refreshToken) {
    throw new Error("No valid tokens in session");
  }

  return user;
}

export async function getValidAccessToken(): Promise<string> {
  const user = await getSessionTokens();

  const now = Date.now();
  const accessExp = user.accessTokenExpiration ? user.accessTokenExpiration * 1000 : 0;

  if (accessExp && now < accessExp - 60_000) {
    return user.accessToken;
  }

  console.log("[wp-auth] Access token expired, attempting refresh...");

  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
      Origin: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({
      query: `
        mutation RefreshAuthToken($token: String!) {
          refreshToken(input: { refreshToken: $token }) {
            authToken
            authTokenExpiration
            success
          }
        }
      `,
      variables: { token: user.refreshToken },
    }),
  });

  const json = await res.json();

  if (!json.data?.refreshToken?.success) {
    throw new Error("Token refresh failed: " + (json.errors?.[0]?.message ?? "Unknown error"));
  }

  console.log("[wp-auth] Token refresh successful");
  return json.data.refreshToken.authToken;
}

export async function wpFetch<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
  options?: { accessToken?: string }
): Promise<T> {
  const accessToken = options?.accessToken ?? await getValidAccessToken();

  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({ query, variables }),
  });

  // Handle test mocks that may not have text() method
  const rawText = typeof res.text === "function" ? await res.text() : JSON.stringify(await res.json());

  // Handle test mocks that may not have headers
  const contentType = res.headers?.get?.("content-type") ?? "application/json";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    console.error("[wpFetch] NON-JSON response:", res.status, rawText.slice(0, 200));
    throw new Error("WPGraphQL returned non-JSON response (likely captcha)");
  }

  const json = JSON.parse(rawText);

  if (json.errors) {
    const msg = json.errors[0]?.message ?? "WPGraphQL error";
    console.error("[wpFetch] GraphQL errors:", json.errors);
    throw new Error(msg);
  }

  return json.data;
}