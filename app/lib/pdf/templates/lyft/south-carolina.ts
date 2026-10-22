import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for South Carolina.
 *
 * Coordinates source: `app/lib/pdf-coordinates/lyft_us_sc.json`
 */
export const lyft_sc: TemplateMapper = {
  key: "lyft_us_sc",
  blankPdfPath: "lyft_us_sc.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};