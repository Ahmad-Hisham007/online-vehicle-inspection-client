"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { wpFetch } from "@/app/lib/wp-auth";
import { assertSessionActive } from "@/app/lib/refresh-token";
import { isAdministrator } from "@/app/lib/access";

export interface InspectorOption {
  databaseId: number;
  name: string;
}

interface InspectorsResponse {
  users: {
    nodes: {
      databaseId: number;
      name?: string;
    }[];
  };
}

const INSPECTORS_QUERY = `
  query ListInspectors($limit: Int, $roleIn: [UserRoleEnum]) {
    users(where: { limit: $limit, roleIn: $roleIn }) {
      nodes {
        databaseId
        name
      }
    }
  }
`;

const INSPECTORS_CACHE_REVALIDATE = 300; // 5 min

interface InspectorsCacheParams {
  token: string;
}

const getInspectorsCached = unstable_cache(
  async (params: InspectorsCacheParams): Promise<InspectorOption[]> => {
    const data = await wpFetch<InspectorsResponse>(
      INSPECTORS_QUERY,
      { limit: 100, roleIn: ["INSPECTOR"] },
      { accessToken: params.token },
    );

    return (data.users?.nodes ?? []).map((u) => ({
      databaseId: u.databaseId,
      name: u.name ?? `#${u.databaseId}`,
    }));
  },
  ["inspectors", "list"],
  { revalidate: INSPECTORS_CACHE_REVALIDATE, tags: ["users"] },
);

export async function listInspectors(): Promise<InspectorOption[]> {
  const session = await auth();
  if (!session?.user?.accessToken || !isAdministrator(session.user.role)) {
    return [];
  }
  assertSessionActive(session.error);

  return getInspectorsCached({ token: session.user.accessToken });
}

interface UpdateInspectionResponse {
  updateInspection?: {
    inspection?: {
      databaseId?: number;
      authorDatabaseId: number;
    } | null;
  } | null;
}

const ASSIGN_MUTATION = `
  mutation AssignInspector($input: UpdateInspectionInput!) {
    updateInspection(input: $input) {
      inspection {
        databaseId
        authorDatabaseId
      }
    }
  }
`;

export async function assignInspector(
  inspectionId: string,
  inspectorDatabaseId: number | null,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.accessToken || !isAdministrator(session.user.role)) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  const data = await wpFetch<UpdateInspectionResponse>(ASSIGN_MUTATION, {
    input: {
      id: inspectionId,
      assignedInspector: inspectorDatabaseId,
      inspectionDetails: { inspectionStatus: "in_progress" },
    },
  });

  if (!data.updateInspection) {
    throw new Error("Failed to update assignment");
  }

  revalidateTag("request-admin", "max");
  revalidateTag("inspections", "max");
  revalidatePath(`/dashboard/admin/inspection/${inspectionId}`);
  revalidatePath(`/dashboard/customer/inspection/${inspectionId}`);
  revalidateTag(`inspection-list:author:${session.user.wpId}`, "max");
  revalidateTag(
    `inspection-list:author:${data.updateInspection.inspection?.authorDatabaseId}`,
    "max",
  );
  revalidateTag(`inspection-list:author:${inspectorDatabaseId}`, "max");
  revalidateTag(`inspection:${inspectionId}`, "max");

  return { ok: true };
}
