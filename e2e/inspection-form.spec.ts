import { test, expect, Page } from "@playwright/test";
import path from "path";

const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password";
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const testImage = path.join(FIXTURES_DIR, "test-image.jpg");
const testVideo = path.join(FIXTURES_DIR, "test-video.mp4");

/** Upload a file to the FileUploadField and wait for it to complete. */
async function uploadFile(
  page: Page,
  stepId: string,
  labelSubstring: string,
  filePath: string,
) {
  const heading = page.locator(`#${stepId} h3`).filter({ hasText: labelSubstring }).first();
  const field = heading.locator("..");
  const input = field.locator('input[type="file"]');
  await input.setInputFiles(filePath);

  // Wait for upload to complete - status becomes "done", shows "Uploaded" badge and "Change" button
  await expect(field.locator('text="Uploaded"')).toBeVisible({ timeout: 60000 });
  await expect(field.locator('button:has-text("Change")')).toBeVisible({ timeout: 60000 });
}

/** Log in with test credentials and return to the inspection page. */
async function loginIfNeeded(page: Page) {
  const url = page.url();
  if (url.includes("/login")) {
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation away from login
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    // Navigate to inspection form
    await page.goto("/dashboard/customer/inspection");
    await page.waitForLoadState("networkidle");
  }
}

test.describe("7-step inspection form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/customer/inspection");
    await loginIfNeeded(page);
    await expect(page.locator("#step-1")).toBeVisible({ timeout: 10000 });
  });

  test.setTimeout(180000);

  test("fills entire 7-step form, persists data, and shows Proceed to Payment", async ({ page }) => {
    // ── Step 1: Vehicle Selection ──────────────────────────────────
    await expect(page.locator("#step-1")).toBeVisible();
    await page.fill("#licensePlate", "ABC1234");
    await page.fill("#mileage", "50000");
    await page.selectOption("#country", "usa");
    await page.selectOption("#state", "CA");

    // Select Turo + Lyft (Turo triggers the conditional section)
    await page.locator('#step-1 button:has(img[alt="Turo"])').click();
    await page.locator('#step-1 button:has(img[alt="Lyft"])').click();

    // Answer Turo radios: tires → Yes, battery → Yes
    const radios = page.locator("#step-1 input[type='radio']");
    await radios.nth(0).check(); // tires Yes
    await radios.nth(2).check(); // battery Yes

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-2")).toBeVisible({ timeout: 5000 });

    // ── Step 2: VIN & License ──────────────────────────────────────
    await page.fill("#vin", "1HGCM82633A123456");
    await page.fill("#make", "Honda");
    await page.fill("#model", "Accord");
    await page.selectOption("#year", "2022");
    await page.selectOption("#fuelType", "gasoline");

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-3")).toBeVisible({ timeout: 5000 });

    // ── Step 3: Media A (3 uploads) ────────────────────────────────
    await uploadFile(page, "step-3", "Registration card", testImage);
    await uploadFile(page, "step-3", "Odometer", testImage);
    await uploadFile(page, "step-3", "Horn", testVideo);

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-4")).toBeVisible({ timeout: 5000 });

    // ── Step 4: Media B (4 uploads) ────────────────────────────────
    await uploadFile(page, "step-4", "Interior driver side", testImage);
    await uploadFile(page, "step-4", "Driver seat adjustment", testImage);
    await uploadFile(page, "step-4", "Interior passenger side", testImage);
    await uploadFile(page, "step-4", "Passenger seat adjustment", testImage);

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-5")).toBeVisible({ timeout: 5000 });

    // ── Step 5: Media C (5 uploads) ────────────────────────────────
    await uploadFile(page, "step-5", "Interior back seat", testImage);
    await uploadFile(page, "step-5", "Exterior Left", testImage);
    await uploadFile(page, "step-5", "Exterior Right", testImage);
    await uploadFile(page, "step-5", "Exterior Front", testVideo);
    await uploadFile(page, "step-5", "Exterior Rear", testVideo);

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-6")).toBeVisible({ timeout: 5000 });

    // ── Step 6: Media D (4 uploads) ────────────────────────────────
    await uploadFile(page, "step-6", "Left front tire", testImage);
    await uploadFile(page, "step-6", "Right front tire", testImage);
    await uploadFile(page, "step-6", "Left rear tire", testImage);
    await uploadFile(page, "step-6", "Right rear tire", testImage);

    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-7")).toBeVisible({ timeout: 5000 });

    // ── Step 7: Review & Payment ───────────────────────────────────
    // Check both agreement checkboxes
    await page.locator("#userAgreement").click();
    await page.locator("#inspectionAgreement").click();

    // Assert button text
    const paymentButton = page.locator('button:has-text("Proceed to Payment")');
    await expect(paymentButton).toBeVisible();

    // Assert sessionStorage contains inspection data
    const stored = await page.evaluate(() =>
      sessionStorage.getItem("inspection-storage"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state).toHaveProperty("vehicleInfo");
    expect(parsed.state).toHaveProperty("uploadFields");
  });
});
