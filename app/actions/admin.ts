"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { wpFetch } from "@/app/lib/wp-auth";
import { assertSessionActive } from "@/app/lib/refresh-token";
import { isAdministrator, isInspector } from "@/app/lib/access";

interface UpdateInspectionResponse {
  updateInspection?: {
    inspection?: { databaseId?: number } | null;
  } | null;
}

const UPDATE_STATUS_MUTATION = `
  mutation UpdateInspectionStatus($input: UpdateInspectionInput!) {
    updateInspection(input: $input) {
      inspection {
        databaseId
      }
    }
  }
`;

export async function rejectInspection(inspectionId: string): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.accessToken || (!isAdministrator(role) && !isInspector(role))) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  const data = await wpFetch<UpdateInspectionResponse>(UPDATE_STATUS_MUTATION, {
    input: {
      id: inspectionId,
      inspectionDetails: {
        inspectionStatus: "rejected",
      },
    },
  });

  if (!data.updateInspection?.inspection) {
    throw new Error("Failed to reject inspection");
  }

  revalidateTag("requests", "max");
  revalidateTag("archive", "max");
  revalidateTag("inspections", "max");
}

// TODO(phase 6.4): approveInspection(id) — sets inspectionStatus "approved",
// persists generated certificates and populates expiryDate (PDF phase).

/**
 * Approve an inspection with certificate URLs.
 * This function:
 * 1. Marks the inspection as "approved"
 * 2. Saves certificate URLs for each company
 * 3. Populates expiry dates
 * 
 * @param inspectionId - The WordPress ID of the inspection
 * @param certificateUrls - Map of company name to certificate URL (Bunny CDN public URL)
 */
export async function approveInspection(
  inspectionId: string,
  certificateUrls: Record<string, string>,
): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.accessToken || (!isAdministrator(role) && !isInspector(role))) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  // Build inspection details with certificates
  const inspectionDetails: Record<string, unknown> = {
    inspectionStatus: "approved",
  };

  // Add certificate URLs for each company type
  const certificateFieldMap: Record<string, string> = {
    lyft: "lyftCertificate",
    uber: "uberCertificate",
    turo: "turoCertificate",
  };

  // Add certificate URLs and expiry dates
  for (const [company, url] of Object.entries(certificateUrls)) {
    const fieldName = certificateFieldMap[company];
    if (fieldName && url) {
      inspectionDetails[fieldName] = url;
      
      // Calculate expiry date (1 year from inspection date - assumed to be 1 year validity)
      // In production, this would come from the certificate itself or be calculated properly
      inspectionDetails[`${fieldName}ExpiryDate`] = calculateExpiryDate();
    }
  }

  const data = await wpFetch<UpdateInspectionResponse>(UPDATE_STATUS_MUTATION, {
    input: {
      id: inspectionId,
      inspectionDetails,
    },
  });

  if (!data.updateInspection?.inspection) {
    throw new Error("Failed to approve inspection");
  }

  revalidateTag("requests", "max");
  revalidateTag("archive", "max");
  revalidateTag("inspections", "max");
}

/**
 * Calculate expiry date for certificates (1 year from now).
 * In production, this would be more sophisticated.
 */
function calculateExpiryDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
