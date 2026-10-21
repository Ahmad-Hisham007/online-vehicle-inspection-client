import { test, expect, BrowserContext } from "@playwright/test";
import { decode, encode } from "next-auth/jwt";
import { loginWithCredentials, isOnLoginPage } from "./helpers/auth";

const SESSION_COOKIE = "authjs.session-token";

/**
 * These specs guard the "clicking Add logs you out" regression.
 *
 * They reproduce the real navigation path (login -> listing -> Add button, which
 * calls router.push and triggers an RSC request through the proxy) and fail if
 * the proxy bounces the request to /login.
 *
 * Run against a production server to cover the reported case:
 *   npm run build && npm start
 *   PW_HEADLESS=1 npx playwright test e2e/add-inspection-session.spec.ts
 */

interface SessionTokenUser {
  accessToken?: string;
  accessTokenExpiration?: number;
  refreshToken?: string;
}

interface SessionToken {
  user?: SessionTokenUser;
}

test.describe("Add inspection keeps the session alive", () => {
  test.setTimeout(120_000);

  test("clicking Add opens the inspection form instead of /login", async ({
    page,
    context,
  }) => {
    await loginWithCredentials(page);

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === SESSION_COOKIE,
    );
    expect(sessionCookie?.value, "login must set a session cookie").toBeTruthy();

    await page.goto("/dashboard/customer");
    await expect(
      page.getByRole("heading", { name: "Submitted Inspections" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/customer\/inspection$/, {
      timeout: 30_000,
    });
    expect(isOnLoginPage(page.url()), "Add must not redirect to /login").toBe(
      false,
    );
    await expect(page.getByText("Vehicle & Selection")).toBeVisible();
  });

  test("an expired WP access token is refreshed instead of ending the session", async ({
    page,
    context,
  }) => {
    await loginWithCredentials(page);

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === SESSION_COOKIE,
    );
    expect(sessionCookie, "login must set a session cookie").toBeTruthy();

    await expireAccessToken(context, sessionCookie!.value);

    await page.goto("/dashboard/customer");
    expect(isOnLoginPage(page.url()), "refresh must not end the session").toBe(
      false,
    );
    await expect(
      page.getByRole("heading", { name: "Submitted Inspections" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/customer\/inspection$/, {
      timeout: 30_000,
    });
    expect(isOnLoginPage(page.url()), "Add must not redirect to /login").toBe(
      false,
    );
    await expect(page.getByText("Vehicle & Selection")).toBeVisible();
  });

  test("fresh profile: login then Add without a page reload", async ({
    page,
    context,
  }) => {
    await loginWithCredentials(page);

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === SESSION_COOKIE,
    );
    expect(sessionCookie?.value, "login must set a session cookie").toBeTruthy();

    await page.getByRole("button", { name: /^add$/i }).click();

    expect(isOnLoginPage(page.url()), "Add must not redirect to /login").toBe(
      false,
    );
    await expect(page).toHaveURL(/\/dashboard\/customer\/inspection$/, {
      timeout: 30_000,
    });
  });

  test("parallel requests with an expired token do not log the user out", async ({
    page,
    context,
  }) => {
    await loginWithCredentials(page);

    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === SESSION_COOKIE,
    );
    expect(sessionCookie, "login must set a session cookie").toBeTruthy();

    await expireAccessToken(context, sessionCookie!.value);

    // Prefetch + navigation fire against the same stale cookie. If each request
    // refreshes independently, WordPress rejects the duplicates and the proxy
    // starts answering with a redirect to /login.
    const responses = await page.evaluate(async () => {
      const targets = [
        "/dashboard/customer",
        "/dashboard/customer",
        "/dashboard/customer/inspection",
        "/dashboard/customer/inspection",
        "/dashboard",
      ];

      const results = await Promise.all(
        targets.map(async (target) => {
          const response = await fetch(target, { redirect: "manual" });
          return {
            target,
            status: response.status,
            location: response.headers.get("location"),
          };
        }),
      );

      return results;
    });

    const logouts = responses.filter((response) =>
      (response.location ?? "").includes("/login"),
    );

    expect(
      logouts,
      `requests were bounced to /login: ${JSON.stringify(responses)}`,
    ).toEqual([]);

    await page.goto("/dashboard/customer");
    await expect(
      page.getByRole("heading", { name: "Submitted Inspections" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customer\/inspection$/, {
      timeout: 30_000,
    });
  });
});

/**
 * Rewrites the encrypted session cookie so the stored WordPress access token
 * looks expired. The next request therefore takes the jwt-callback refresh
 * path, which is where a rejected refresh token used to log the user out.
 */
async function expireAccessToken(
  context: BrowserContext,
  cookieValue: string,
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  expect(secret, "AUTH_SECRET is required to rewrite the session token").toBeTruthy();

  const decoded = (await decode({
    token: cookieValue,
    secret: secret!,
    salt: SESSION_COOKIE,
  })) as SessionToken | null;

  expect(decoded?.user, "session cookie must contain the user payload").toBeTruthy();

  const token = decoded as SessionToken;
  token.user = {
    ...token.user,
    accessTokenExpiration: Math.floor(Date.now() / 1000) - 60,
  };

  const reEncoded = await encode({
    token: decoded as Parameters<typeof encode>[0]["token"],
    secret: secret!,
    salt: SESSION_COOKIE,
  });

  const cookies = await context.cookies();
  const original = cookies.find((cookie) => cookie.name === SESSION_COOKIE)!;

  await context.addCookies([{ ...original, value: reEncoded }]);
}
