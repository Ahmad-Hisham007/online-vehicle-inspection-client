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
