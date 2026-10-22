import { describe, it, expect } from "vitest";
import {
  getTemplateMapper,
  hasTemplateMapper,
  templateRegistryKey,
  PdfTemplateMissingError,
} from "@/app/lib/pdf/resolver";

describe("resolver", () => {
  describe("getTemplateMapper", () => {
    it("returns mapper for Lyft CA", async () => {
      const mapper = await getTemplateMapper({
        company: "lyft",
        country: "USA",
        state: "CA",
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("lyft_us_ca");
      expect(mapper.blankPdfPath).toBe("lyft_us_ca.pdf");
    });

    it("returns mapper for Uber CA", async () => {
      const mapper = await getTemplateMapper({
        company: "uber",
        country: "USA",
        state: "CA",
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("uber_us_ca");
    });

    it("returns mapper for Turo all-states", async () => {
      const mapper = await getTemplateMapper({
        company: "turo",
        country: "USA",
        state: "TX", // Any state should map to all-states
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("turo_us_all");
    });

    it("normalizes case", async () => {
      const mapper = await getTemplateMapper({
        company: "LYFT",
        country: "usa",
        state: "ca",
      });

      expect(mapper.key).toBe("lyft_us_ca");
    });

    it("throws PdfTemplateMissingError for unknown combination", async () => {
      // Test with a company/state that doesn't have a template yet
      await expect(
        getTemplateMapper({
          company: "lyft",
          country: "USA",
          state: "TX", // Texas doesn't have a Lyft template yet
        }),
      ).rejects.toThrow(PdfTemplateMissingError);
    });

    it("throws with correct context in error", async () => {
      await expect(() =>
        getTemplateMapper({
          company: "lyft",
          country: "USA",
          state: "TX",
        }),
      ).rejects.toMatchObject({
        company: "lyft",
        country: "USA",
        state: "TX",
      });
    });
  });

  describe("templateRegistryKey", () => {
    it("uses the canonical (company)_(country-short)_(region) format", () => {
      expect(templateRegistryKey("lyft", "USA", "IL")).toBe("lyft_us_il");
      expect(templateRegistryKey("uber", "USA", "CA")).toBe("uber_us_ca");
    });

    it("maps legacy usa country form to us", () => {
      expect(templateRegistryKey("lyft", "usa", "CA")).toBe("lyft_us_ca");
      expect(templateRegistryKey("lyft", "USA", "CA")).toBe("lyft_us_ca");
    });

    it("maps Turo to the blanket all-states key", () => {
      expect(templateRegistryKey("turo", "USA", "TX")).toBe("turo_us_all");
      expect(templateRegistryKey("turo", "USA", "FL")).toBe("turo_us_all");
    });

    it("supports Canada country codes", () => {
      expect(templateRegistryKey("lyft", "Canada", "ON")).toBe("lyft_canada_on");
    });
  });

  describe("hasTemplateMapper", () => {
    it("returns true when template exists", () => {
      expect(
        hasTemplateMapper({ company: "lyft", country: "USA", state: "CA" }),
      ).toBe(true);
    });

    it("returns false when template does not exist", () => {
      expect(
        hasTemplateMapper({ company: "lyft", country: "USA", state: "TX" }),
      ).toBe(false);
    });

    it("returns true for Turo with any state", () => {
      expect(hasTemplateMapper({ company: "turo", country: "USA", state: "CA" })).toBe(true);
      expect(hasTemplateMapper({ company: "turo", country: "USA", state: "TX" })).toBe(true);
      expect(hasTemplateMapper({ company: "turo", country: "USA", state: "FL" })).toBe(true);
    });

    it("accepts the legacy usa country form", () => {
      expect(
        hasTemplateMapper({ company: "lyft", country: "usa", state: "IL" }),
      ).toBe(true);
    });
  });
});
