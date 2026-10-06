import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for Nevada.
 *
 * Coordinates source: `app/lib/pdf-coordinates/lyft_usa_nv.json`
 */
export const lyft_nv: TemplateMapper = {
  key: "lyft_usa_nv",
  blankPdfPath: "lyft_usa_nv.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};