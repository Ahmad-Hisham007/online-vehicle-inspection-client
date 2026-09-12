"use server";

import { unstable_cache } from "next/cache";
import { AdminRequestSummary, InspectionStatus } from "../lib/types";
import { wpFetch } from "../lib/wp-auth";
import { auth } from "@/auth";
import { assertSessionActive } from "../lib/refresh-token";
import { isAdministrator, isInspector } from "../lib/access";

interface AdminRequestsParams {
  page?: number;
  perPage?: number;
  status?: InspectionStatus | null;
  search?: string;
}

export interface AdminRequestsPage {
  items: AdminRequestSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
interface InspectionDetailsNode {
  inspectionStatus: string;
  inspectionStateUsa: string | null;
  inspectionStateCanada: string | null;
  inspectionCountry: string | null;
}
interface InspectionNode {
  databaseId: number;
  title: string;
  date: string;
  author: {
    node: {
      displayName: string;
    };
  };
  assignedInspector: {
    databaseId: number;
    name?: string;
  } | null;
  inspectionDetails: InspectionDetailsNode;
}

interface ListRequestsResponse {
  inspections: {
    nodes: InspectionNode[];
    pageInfo?: {
      total?: number;
    };
  };
}

const DEFAULT_PER_PAGE = 10;
const LIST_CACHE_REVALIDATE = 300;

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function mapSummary(node: InspectionNode): AdminRequestSummary {
  return {
    id: node.databaseId.toString(),
    title: node.title,
    dateCreated: node.date,
    inspectionStatus: asString(
      node.inspectionDetails.inspectionStatus,
    ) as InspectionStatus,
    location:
      node.inspectionDetails.inspectionStateUsa ??
      node.inspectionDetails.inspectionStateCanada,
      country: node.inspectionDetails.inspectionCountry,
    author: node.author.node.displayName,
    assignedInspector: node.assignedInspector
      ? {
          databaseId: node.assignedInspector.databaseId,
          name: node.assignedInspector.name ?? "",
        }
      : null,
  };
}

const REQUESTS_LIST_QUERY = `
  query ListMyInspections(
    $limit: Int
    $offset: Int
    $inspectionStatus: String
    $search: String
    $inspectionStatusNotIn: [String]
    $assignedInspector: Int
  ) {
    inspections(
      where: {
        search: $search
        limit: $limit
        offset: $offset
        inspectionStatus: $inspectionStatus
        inspectionStatusNotIn: $inspectionStatusNotIn
        assignedInspector: $assignedInspector
      }
    ) {
      nodes {
        databaseId
        title
        date
        inspectionDetails {
          inspectionStatus
          inspectionStateUsa
          inspectionStateCanada
          inspectionCountry
        }
        author {
         node {
           displayName
         }
      }
        assignedInspector {
          databaseId
          name
        }
      }
      pageInfo {
        total
      }
    }
  }
`;

interface RequestsPageParams {
  token: string;
  page: number;
  perPage: number;
  status: InspectionStatus | null;
  search?: string;
  assignedInspector: number | null;
}

const getRequestsPageCached = unstable_cache(
  async (params: RequestsPageParams) => {
    const { token, page, perPage, status, search, assignedInspector } = params;

    const data = await wpFetch<ListRequestsResponse>(
      REQUESTS_LIST_QUERY,
      {
        inspectionStatus: status ?? null,
        limit: perPage,
        offset: (page - 1) * perPage,
        search: search,
        inspectionStatusNotIn: ["approved", "rejected", "cancelled"],
        assignedInspector,
      },
      { accessToken: token },
    );

    const nodes = data.inspections?.nodes ?? [];
    const total = data.inspections?.pageInfo?.total ?? nodes.length;

    return { items: nodes.map(mapSummary), total };
  },
  ["requests", "page"],
  { revalidate: LIST_CACHE_REVALIDATE, tags: ["requests"] },
);

export async function listRequests(
  params: AdminRequestsParams = {},
): Promise<AdminRequestsPage> {
  const session = await auth();
  const userRole = session?.user?.role;
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);
  if (!isAdministrator(userRole) && !isInspector(userRole)) {
    throw new Error("Unauthorized");
  }

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, params.perPage ?? DEFAULT_PER_PAGE);

  // Inspectors only ever see inspections assigned to them.
  const assignedInspector = isInspector(userRole)
    ? session.user.wpId
    : null;

  const { items, total } = await getRequestsPageCached({
    token: session.user.accessToken,
    page,
    perPage,
    status: params.status ?? null,
    search: params.search,
    assignedInspector,
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);

  return { items, page: safePage, perPage, total, totalPages };
}
