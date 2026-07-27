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

async function fillInspectionForm(page: Page) {
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

  await page.fill("#licensePlate", "E2E-TEST");
  await page.fill("#mileage", "25000");
  await page.selectOption("#country", "usa");
  await page.selectOption("#state", "CA");
  await page.locator('#step-1 button:has(img[alt="Turo"])').click();
  await page.locator('#step-1 button:has(img[alt="Lyft"])').click();
  const radios = page.locator("#step-1 input[type='radio']");
  await radios.nth(0).check();
  await radios.nth(2).check();
  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-2")).toBeVisible({ timeout: 5000 });

  await page.fill("#vin", "1HGCM82633A654321");
  await page.fill("#make", "Toyota");
  await page.fill("#model", "Camry");
  await page.selectOption("#year", "2023");
  await page.selectOption("#fuelType", "gasoline");
  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-3")).toBeVisible({ timeout: 5000 });

  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-4")).toBeVisible({ timeout: 5000 });
  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-5")).toBeVisible({ timeout: 5000 });
  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-6")).toBeVisible({ timeout: 5000 });
  await page.locator('button:has-text("Next")').click();
  await expect(page.locator("#step-7")).toBeVisible({ timeout: 5000 });
}

test.describe("Stripe payment flow", () => {
  test.setTimeout(300000);

  test("completes full inspection with Stripe test card 4242", async ({ page }) => {
    await fillInspectionForm(page);

    await page.locator("#userAgreement").click();
    await page.locator("#inspectionAgreement").click();
    await page.locator('button:has-text("Proceed to Payment")').click();

    const payNowButton = page.locator('button:has-text("Pay Now")');
    try {
      await expect(payNowButton).toBeVisible({ timeout: 20000 });
    } catch {
      const backOnReview = await page.locator('button:has-text("Proceed to Payment")').isVisible();
      if (backOnReview) {
        const toast = page.locator('[role="status"], .Toastify__toast, .go3958317564');
        const toastText = (await toast.textContent()) || "no toast visible";
        throw new Error(`Payment failed on server.\nToast: ${toastText}`);
      }
      throw new Error("Payment form did not appear (unknown state)");
    }

    const stripeFrame = page.frameLocator('iframe[src*="stripe.com"], iframe[title*="Secure"], iframe[name*="__privateStripe"]').first();
    await page.waitForTimeout(3000);
    const cardField = stripeFrame.locator('[name="cardnumber"], [name="number"], input[autocomplete="cc-number"]').first();
    const expField = stripeFrame.locator('[name="exp-date"], [name="expiry"], input[autocomplete="cc-exp"]').first();
    const cvcField = stripeFrame.locator('[name="cvc"], [name="cvv"], input[autocomplete="cc-csc"]').first();
    await cardField.waitFor({ state: "attached", timeout: 15000 });
    await cardField.fill("4242424242424242");
    await expField.fill("1230");
    await cvcField.fill("123");
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Pay Now")').click();

    await expect(page.locator('text="Payment Successful!"')).toBeVisible({ timeout: 30000 });
    await expect(page.locator("text=Go to Dashboard")).toBeVisible();

    // Verify WordPress backend fields updated (poll until webhook processes)
    const inspectionId = new URL(page.url()).searchParams.get("inspectionId");
    await expect(async () => {
      const res = await page.request.get(`/api/payment/status?inspectionId=${inspectionId}`);
      const data = await res.json();
      expect(data.paymentStatus).toBe("succeeded");
      expect(data.inspectionStatus).toBe("paid");
    }).toPass({ timeout: 15000 });
  });
});