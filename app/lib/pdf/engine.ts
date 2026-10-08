import { PDFDocument, rgb, StandardFonts, type RGB } from "pdf-lib";
import { mulberry32 } from "./rng";
import { applyPlacements } from "./templates/baseMapper";
import { getTemplateMapper } from "./resolver";
import { readAsset } from "./file-utils";
import type { CertificateData, DrawContext } from "./types";

/**
 * Render a certificate PDF given the typed data and a seed for deterministic
 * jitter. Returns a Uint8Array that can be base64-encoded for preview or uploaded
 * to Bunny Storage.
 *
 * The seed is typically Date.now() for production diversity; tests use fixed
 * seeds for byte-identical output verification.
 */
export async function renderCertificate(
  data: CertificateData,
  seed: number,
): Promise<Uint8Array> {
  // 1. Resolve the appropriate template mapper (async for dynamic imports)
  const mapper = await getTemplateMapper({
    company: data.company,
    country: data.country,
    state: data.state,
  });

  // 2. Load the blank PDF
  const blankPdfBytes = await readAsset(mapper.blankPdfPath);

  // 3. Parse the PDF
  const pdfDoc = await PDFDocument.load(blankPdfBytes, {
    updateMetadata: false,
  });
  
  // Use built-in Helvetica font to avoid fontkit native dependency issues
  // StandardFonts.Helvetica is a built-in PDF font (no embedding needed)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 4. Get the target page (default is page 0 or 1)
  const page = pdfDoc.getPages()[mapper.page ?? 0];

  // 5. Set up the draw context with seeded RNG for deterministic jitter
  const ink: RGB = rgb(0.07, 0.09, 0.16);
  const ctx: DrawContext = {
    page,
    font,
    ink,
    rand: mulberry32(seed),
  };

  // 6. Apply all placements from the mapper
  applyPlacements(ctx, data, mapper);

  // 7. Run optional decoration (signature, logos, etc.)
  mapper.decorate?.(ctx, data);

  // 8. Serialize to Uint8Array
  return pdfDoc.save({ useObjectStreams: true });
}