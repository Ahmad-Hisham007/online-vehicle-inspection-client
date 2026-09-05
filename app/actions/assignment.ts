"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { wpFetch } from "@/app/lib/wp-auth";
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

  return getInspectorsCached({ token: session.user.accessToken });
}

interface UpdateInspectionResponse {
  updateInspection?: {
    inspection?: { databaseId?: number } | null;
  } | null;
}

const ASSIGN_MUTATION = `
  mutation AssignInspector($input: UpdateInspectionInput!) {
    updateInspection(input: $input) {
      inspection {
        databaseId
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

  const data = await wpFetch<UpdateInspectionResponse>(
    ASSIGN_MUTATION,
    {
      input: {
        id: inspectionId,
        assignedInspector: inspectorDatabaseId,
      },
    },
  );

  if (!data.updateInspection) {
    throw new Error("Failed to update assignment");
  }

  revalidateTag("requests", "max");
  revalidateTag("archive", "max");
  revalidateTag("inspections", "max");

  return { ok: true };
}
