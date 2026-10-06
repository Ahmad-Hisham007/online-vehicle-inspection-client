"use server";

import { auth } from "@/auth";
import { assertSessionActive } from "@/app/lib/refresh-token";
import type { InspectionDetail } from "@/app/lib/types";
import { buildCertificateData } from "@/app/lib/pdf/data";
import type { CertificateData } from "@/app/lib/pdf/types";

/**
 * Response shape for `generateCertificate` preview.
 * Returns a data-URL that the browser can render directly.
 */
export interface CertificatePreview {
  /** Data URL for immediate preview (blob: or data:) */
  previewUrl: string;
  /** MIME type, always "application/pdf" */
  mimeType: string;
  /** MIME type with charset for Content-Disposition */
  contentDisposition: string;
}

/**
 * Render a certificate for a given inspection detail and return a preview URL.
 *
 * - Validates session (admin/inspector only)
 * - Builds typed CertificateData from InspectionDetail
 * - Renders PDF via pdf-lib engine
 * - Returns data-URL suitable for preview or download
 *
 * Input: inspectionDatabaseId (the WP database ID, e.g. "123")
 * Output: { previewUrl: "data:application/pdf;base64,..." }
 *
 * Production note: The rendered bytes are then uploaded to Bunny CDN
 * via `prepareCertificateUpload` (T7), but preview happens via data-URL.
 */
export async function generateCertificate(
  inspectionDatabaseId: string,
  options?: {
    /** Override template key (rarely needed, resolver handles fallbacks). */
    templateKey?: string;
    /** Seed for deterministic PDF layout. Defaults to Date.now(). */
    seed?: number;
  },
): Promise<CertificatePreview> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }
  // Allow admin AND inspector, but not customer
  const role = session.user?.role;
  if (role !== "administrator" && role !== "inspector") {
    throw new Error("Forbidden");
  }
  assertSessionActive(session.error);

  // Lazy-load engine to keep cold-start low for other actions
  const { renderCertificate } = await import("@/app/lib/pdf/engine");

  // Build certificate data from the inspection
  // We need the full detail for this - fetch it lazily to avoid circular deps
  const { fetchInspection } = await import("@/app/actions/inspections");
  const detail = await fetchInspection(inspectionDatabaseId);

  const certData: CertificateData = buildCertificateData(
    detail as InspectionDetail,
    options?.templateKey,
  );

  // Render with seeded RNG for deterministic layout
  const seed = options?.seed ?? Date.now();
  const pdfBytes = await renderCertificate(certData, seed);

  // Convert to data-URL for preview
  const base64 = Buffer.from(pdfBytes).toString("base64");
  const previewUrl = `data:application/pdf;base64,${base64}`;

  return {
    previewUrl,
    mimeType: "application/pdf",
    contentDisposition: `attachment; filename="certificate-${inspectionDatabaseId}.pdf"`,
  };
}