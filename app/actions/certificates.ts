
import { saveCertificateToCDN } from "./certificate";

/**
 * Save a certificate PDF from data URL to Bunny CDN and update Zustand.
 * This is a client-callable server action.
 */
export async function uploadAndSaveCertificate(
  dataUrl: string,
  inspectionId: string,
  company: "lyft" | "uber" | "turo",
): Promise<{ publicUrl: string }> {
  return saveCertificateToCDN(dataUrl, company, inspectionId);
}
