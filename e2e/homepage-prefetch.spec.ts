import { test, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./helpers/auth";

/**
 * Guards the "homepage prefetch poisons the session" regression.
 *
 * The landing page renders <Link href="/dashboard/customer/inspection"> CTAs.
 * While logged out, their prefetch hit the proxy and was answered with a
 * cached 307 to /login — which the router later replayed for a signed-in
 * user clicking Add. The landing-page CTAs now use prefetch={false}.
 *
 * This spec follows the real user path: open the homepage, navigate to the
 * login page through the header, sign in, then click Add.
 */
test.describe("homepage -> login -> Add keeps the session", () => {
  test.setTimeout(120_000);

  test("navigating to login from the homepage does not poison the Add flow", async ({
    page,
    context,
  }) => {
    // 1. Land on the homepage logged out — this is where the bad prefetch
    //    used to fire.
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);

    // 2. Navigate to the login page through the header menu (client-side
    //    navigation, same as the user). The header renders twice (desktop +
    //    mobile drawer); the desktop one sits under the hero overlay, so
    //    target the mobile drawer trigger first, then the link inside it.
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("link", { name: /^login$/i }).first().click();
    await expect(page).toHaveURL(/\/login$/);

    // 3. Sign in with credentials.
    const form = page.locator("#login-form");
    await form.waitFor({ state: "visible" });
    await form.locator('input[name="email"]').fill(TEST_EMAIL);
    await form.locator('input[name="password"]').fill(TEST_PASSWORD);
    await form.locator('input[name="password"]').press("Enter");
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

    // 4. The session cookie must exist and be sent with dashboard requests.
    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "authjs.session-token",
    );
    expect(sessionCookie?.value, "login must set a session cookie").toBeTruthy();

    // 5. Click Add — must reach the inspection form, never /login.
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customer\/inspection$/, {
      timeout: 30_000,
    });
    expect(page.url()).not.toMatch(/\/login/);
    await expect(page.getByText("Vehicle & Selection")).toBeVisible();
  });
});
