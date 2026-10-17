"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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
  if (
    !session?.user?.accessToken ||
    (!isAdministrator(role) && !isInspector(role))
  ) {
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

  // Revalidate relevant caches after rejection
  // Item moves from requests to archive
  revalidateTag("request-admin", "max");
  revalidateTag("archive-admin", "max");
  // Granular cache invalidation for specific inspection detail pages
  revalidatePath(`/dashboard/admin/inspection/${inspectionId}`);
  revalidateTag(`inspection:${inspectionId}`, "max");
}

// TODO(phase 6.4): approveInspection(id) — sets inspectionStatus "approved",
// persists generated certificates and populates expiryDate (PDF phase).

/**
 * Approve an inspection with certificate URLs and all field overrides.
 * This function:
 * 1. Marks the inspection as "approved"
 * 2. Saves all form field overrides from Zustand
 * 3. Saves certificate URLs for each company
 * 4. Populates expiry dates
 *
 * @param inspectionId - The WordPress ID of the inspection
 * @param data - Full inspection data payload
 * @param data.mergedOverrides - All field values from form
 * @param data.certificates - Certificate URLs by company
 */
export async function approveInspection(
  inspectionId: string,
  data: {
    mergedOverrides: Record<string, string>;
    certificates: Record<string, string>;
  },
): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;
  if (
    !session?.user?.accessToken ||
    (!isAdministrator(role) && !isInspector(role))
  ) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  // Build inspection details - start with status
  const inspectionDetails: Record<string, unknown> = {
    inspectionStatus: "approved",
  };

  // Merge all form field overrides
  const { mergedOverrides, certificates } = data;
  Object.assign(inspectionDetails, mergedOverrides);

  // Add certificate URLs and expiry dates for each company
  const certificateFieldMap: Record<string, string> = {
    lyft: "lyftCertificate",
    uber: "uberCertificate",
    turo: "turoCertificate",
  };

  // WP GraphQL maps all certificate expiry dates to a single 'expiryDate' field
  // This override ensures the correct expiry date is used based on which company is being processed
  const expiryDate = calculateExpiryDate();

  for (const [company, url] of Object.entries(certificates)) {
    const fieldName = certificateFieldMap[company];
    if (fieldName && url) {
      inspectionDetails[fieldName] = url;
      // Map expiry date - WordPress expects 'expiryDate' field
      inspectionDetails["expiryDate"] = expiryDate;
    }
  }

  const response = await wpFetch<UpdateInspectionResponse>(
    UPDATE_STATUS_MUTATION,
    {
      input: {
        id: inspectionId,
        inspectionDetails,
      },
    },
  );

  if (!response.updateInspection?.inspection) {
    throw new Error("Failed to approve inspection");
  }

  // Revalidate relevant caches after approval
  // Item moves from requests to archive (approved status is excluded from requests, included in archive)
  revalidateTag("request-admin", "max");
  revalidateTag("archive-admin", "max");
  // Granular cache invalidation for specific inspection detail pages
  revalidatePath(`/dashboard/admin/inspection/${inspectionId}`);
  revalidateTag(`inspection:${inspectionId}`, "max");
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
