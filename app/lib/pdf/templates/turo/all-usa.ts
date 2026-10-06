import type { TemplateMapper } from "../../types";

/**
 * Turo all-USA certificate template.
 *
 * Coordinates source: `app/lib/pdf-coordinates/turo_usa_all.json`
 *
 * Notes (per fields-overwrite.md):
 * - voltageGreaterThan12_1V: checklist item 21
 * - batteryLessThan5YearsOld: checklist item 20
 * - aseLicenseId: mapped from ARD number
 * - Pass Circle Position: x:160, y:242
 */
export const turo_all_usa: TemplateMapper = {
  key: "turo_usa_all",
  blankPdfPath: "turo_usa_all.pdf",
  page: 0,
  placements: [], // TODO: add coordinates
};