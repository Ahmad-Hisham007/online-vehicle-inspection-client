import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for Nevada.
 *
 * Coordinates source: `app/lib/pdf-coordinates/lyft_us_nv.json`
 */
export const lyft_nv: TemplateMapper = {
  key: "lyft_us_nv",
  blankPdfPath: "lyft_us_nv.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};