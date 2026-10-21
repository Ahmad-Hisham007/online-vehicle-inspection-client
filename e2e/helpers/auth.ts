import { Page } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "";

/**
 * Signs in through the flip-card login form with the seeded customer account.
 *
 * The password field is submitted with Enter: the "Login" button sits inside a
 * CSS 3D-flipped card, and clicking it is unreliable in automated browsers
 * because the off-screen signup panel overlaps the same coordinates.
 */
export async function loginWithCredentials(page: Page): Promise<void> {
  await page.goto("/login");

  const form = page.locator("#login-form");
  await form.waitFor({ state: "visible" });

  await form.locator('input[name="email"]').fill(TEST_EMAIL);
  await form.locator('input[name="password"]').fill(TEST_PASSWORD);
  await form.locator('input[name="password"]').press("Enter");

  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");
}

/** True when the page currently sits on the login route (plain or `?expired=1`). */
export function isOnLoginPage(url: string): boolean {
  return new URL(url).pathname.startsWith("/login");
}
