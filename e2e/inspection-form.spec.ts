import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password";

function makeDoneFileMeta(name: string) {
  return { name, size: 1024, status: "done" as const, progress: 100, publicUrl: `https://ucarecdn.com/dummy-${name}` };
}

async function prefillUploadFields(page: Page) {
  const uploadFields = {
    registrationCardPhoto: makeDoneFileMeta("card.jpg"),
    odometerPhoto: makeDoneFileMeta("odo.jpg"),
    hornVideo: makeDoneFileMeta("horn.mp4"),
    interiorDriverSidePhoto: makeDoneFileMeta("int-driver.jpg"),
    driverSeatAdjustmentPhoto: makeDoneFileMeta("seat.jpg"),
    interiorPassengerSidePhoto: makeDoneFileMeta("int-pass.jpg"),
    passengerSeatAdjustmentPhoto: makeDoneFileMeta("pass-seat.jpg"),
    interiorBackSeatPhoto: makeDoneFileMeta("backseat.jpg"),
    exteriorLeftPhoto: makeDoneFileMeta("ext-left.jpg"),
    exteriorRightPhoto: makeDoneFileMeta("ext-right.jpg"),
    exteriorFrontVideo: makeDoneFileMeta("front.mp4"),
    exteriorRearVideo: makeDoneFileMeta("rear.mp4"),
    leftFrontTirePhoto: makeDoneFileMeta("lf-tire.jpg"),
    rightFrontTirePhoto: makeDoneFileMeta("rf-tire.jpg"),
    leftRearTirePhoto: makeDoneFileMeta("lr-tire.jpg"),
    rightRearTirePhoto: makeDoneFileMeta("rr-tire.jpg"),
  };
  await page.evaluate((data) => {
    sessionStorage.setItem("inspection-storage", JSON.stringify({
      state: { currentStep: 0, vehicleInfo: null, vinInfo: null, inspectionScope: null, uploadFields: data, reviewAgreement: null, inspectionId: null },
      version: 0,
    }));
  }, uploadFields);
}

test.describe("7-step inspection form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/customer/inspection");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await prefillUploadFields(page);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/customer/, { timeout: 15000 });
    await page.goto("/dashboard/customer/inspection");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#step-1")).toBeVisible({ timeout: 10000 });
  });

  test.setTimeout(180000);

  test("fills entire 7-step form, persists data, and shows Proceed to Payment", async ({ page }) => {
    await expect(page.locator("#step-1")).toBeVisible();
    await page.fill("#licensePlate", "ABC1234");
    await page.fill("#mileage", "50000");
    await page.selectOption("#country", "usa");
    await page.selectOption("#state", "CA");
    await page.locator('#step-1 button:has(img[alt="Turo"])').click();
    await page.locator('#step-1 button:has(img[alt="Lyft"])').click();
    const radios = page.locator("#step-1 input[type='radio']");
    await radios.nth(0).check();
    await radios.nth(2).check();
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-2")).toBeVisible({ timeout: 5000 });

    await page.fill("#vin", "1HGCM82633A123456");
    await page.fill("#make", "Honda");
    await page.fill("#model", "Accord");
    await page.selectOption("#year", "2022");
    await page.selectOption("#fuelType", "gasoline");
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-3")).toBeVisible({ timeout: 5000 });

    // Steps 3-6: pre-filled via sessionStorage, skip uploads
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-4")).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-5")).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-6")).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("#step-7")).toBeVisible({ timeout: 5000 });

    await page.locator("#userAgreement").click();
    await page.locator("#inspectionAgreement").click();
    await expect(page.locator('button:has-text("Proceed to Payment")')).toBeVisible();

    const stored = await page.evaluate(() => sessionStorage.getItem("inspection-storage"));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state).toHaveProperty("vehicleInfo");
    expect(parsed.state).toHaveProperty("uploadFields");
  });
});