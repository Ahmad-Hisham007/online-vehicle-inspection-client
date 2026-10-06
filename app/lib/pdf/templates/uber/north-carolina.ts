import type { TemplateMapper } from "../../types";

/**
 * Uber certificate template for North + South Carolina (shared form).
 *
 * Coordinates source: `app/lib/pdf-coordinates/uber_usa_nc_sc.json`
 *
 * Notes (per fields-overwrite.md):
 * - stateCheckboxes: render checkmark for NC, SC, or GA based on location.state
 * - facilityName: uses companyName constant
 */
export const uber_nc_sc: TemplateMapper = {
  key: "uber_usa_nc_sc",
  blankPdfPath: "uber_usa_nc_sc.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};