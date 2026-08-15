import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password";

async function login(page: Page) {
  await page.goto("/dashboard/customer");
  await page.waitForURL(/\/login/, { timeout: 10000 });
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/customer/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Customer inspections dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.setTimeout(120000);

  test("shows the inspections listing with Add and Filter actions", async ({
    page,
  }) => {
    await expect(page.locator("text=Submitted Inspections")).toBeVisible();
    await expect(page.locator("button:has-text('Add')")).toBeVisible();
    await expect(page.locator("button:has-text('Filter')")).toBeVisible();
    await expect(page.locator("text=License Plate No.").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Date Created").first()).toBeVisible();
  });

  test("opens the filter modal, applies a status and submits", async ({
    page,
  }) => {
    await expect(page.locator("text=Submitted Inspections")).toBeVisible();

    await page.click("button:has-text('Filter')");
    await expect(page.locator("text=Filter inspections")).toBeVisible();
    await expect(page.locator("text=By status")).toBeVisible();

    await page.click("label:has-text('Approved')");
    await page.click("button:has-text('Submit')");

    await expect(page.locator("text=Filter inspections")).toBeHidden();
  });

  test("unfolds a card and navigates to the detail page", async ({ page }) => {
    await expect(page.locator("text=Submitted Inspections")).toBeVisible();

    const cards = page.locator("button[aria-expanded]");
    if ((await cards.count()) === 0) {
      test.skip(true, "No inspections exist for the test user");
    }

    await cards.first().click();
    await expect(page.locator("text=Car details").first()).toBeVisible();
    await page.locator("text=Car details").first().click();

    await page.waitForURL(/\/dashboard\/customer\/inspection\/\d+/, {
      timeout: 15000,
    });
    await expect(page.locator("text=Car details")).toBeVisible();
    await expect(page.locator("text=Specifications").first()).toBeVisible();
  });
});