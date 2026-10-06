import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTemplateMapper, hasTemplateMapper, PdfTemplateMissingError } from "@/app/lib/pdf/resolver";
import type { TemplateMapper } from "@/app/lib/pdf/types";

describe("resolver", () => {
  describe("getTemplateMapper", () => {
    it("returns mapper for Lyft CA", async () => {
      const mapper = await getTemplateMapper({
        company: "lyft",
        country: "USA",
        state: "CA",
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("lyft_usa_ca");
      expect(mapper.blankPdfPath).toBe("lyft_usa_ca.pdf");
    });

    it("returns mapper for Uber CA", async () => {
      const mapper = await getTemplateMapper({
        company: "uber",
        country: "USA",
        state: "CA",
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("uber_usa_ca");
    });

    it("returns mapper for Turo all-states", async () => {
      const mapper = await getTemplateMapper({
        company: "turo",
        country: "USA",
        state: "TX", // Any state should map to all-states
      });

      expect(mapper).toBeDefined();
      expect(mapper.key).toBe("turo_usa_all");
    });

    it("normalizes case", async () => {
      const mapper = await getTemplateMapper({
        company: "LYFT",
        country: "usa",
        state: "ca",
      });

      expect(mapper.key).toBe("lyft_usa_ca");
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
  });
});