import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for South Carolina.
 *
 * Coordinates source: `app/lib/pdf-coordinates/lyft_usa_sc.json`
 */
export const lyft_sc: TemplateMapper = {
  key: "lyft_usa_sc",
  blankPdfPath: "lyft_usa_sc.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};