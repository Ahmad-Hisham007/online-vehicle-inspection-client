import type { TemplateMapper } from "../../types";

/**
 * Uber certificate template for California.
 *
 * Coordinates source: `app/lib/pdf-coordinates/uber_usa_ca.json`
 *
 * Special rules for Uber CA (per fields-overwrite.md):
 * - hasRegistrationSticker: always rendered as "YES"
 * - registrationStickerMonthyear: rendered in MM/YY format
 * - stateCertificationNumber: mapped from ARD constant (e.g., "ARD315746")
 */
export const uber_ca: TemplateMapper = {
  key: "uber_usa_ca",
  blankPdfPath: "uber_usa_ca.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};