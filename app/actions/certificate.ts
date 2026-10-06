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
 * @param inspectionDatabaseId - The WP database ID of the inspection
 * @param input - Optional parameters
 * @param input.company - The company to generate certificate for (required; inspection.companies[0] if not provided)
 * @param input.seed - Seed for deterministic PDF layout (defaults to Date.now())
 *
 * Output: { previewUrl: "data:application/pdf;base64,..." }
 *
 * Production note: The rendered bytes are then uploaded to Bunny CDN
 * via `prepareCertificateUpload` (T7), but preview happens via data-URL.
 */
export async function generateCertificate(
  inspectionDatabaseId: string,
  input?: {
    /** Company to generate certificate for (e.g., "lyft", "uber", "turo"). */
    company?: string;
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

  // Lazy-load dependencies to keep cold-start low for other actions
  const { fetchInspection } = await import("@/app/actions/inspections");
  const { renderCertificate } = await import("@/app/lib/pdf/engine");

  // Fetch the inspection detail
  const detail = (await fetchInspection(inspectionDatabaseId)) as InspectionDetail;

  // Determine company - use provided company or first one from inspection
  const company = input?.company ?? detail.companies[0] ?? "lyft";

  // Build certificate data from the inspection
  const certData: CertificateData = buildCertificateData(detail, company, {});

  // Render with seeded RNG for deterministic layout
  const seed = input?.seed ?? Date.now();
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