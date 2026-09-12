"use server";

import { unstable_cache } from "next/cache";
import { AdminUserRow } from "../lib/types";
import { wpFetch } from "../lib/wp-auth";
import { auth } from "@/auth";
import { assertSessionActive } from "../lib/refresh-token";

const ADMIN_ROLES = ["administrator", "inspector"];
interface userField {
  phoneNumber?: number | null;
}
interface UserNode {
  databaseId: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  userFields?: userField;
}

interface AdminUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
}
interface AdminUsersFetchResponse {
  users: {
    nodes: UserNode[];
    pageInfo?: {
      total?: number;
    };
  };
}
interface AdminUsersPageParams {
  token: string;
  page: number;
  perPage: number;
  search?: string;
}
export interface AdminUsersPageRender {
  items: AdminUserRow[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
const DEFAULT_PER_PAGE = 10;
const LIST_CACHE_REVALIDATE = 300;

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const USERS_LIST_QUERY = `
  query ListUsers(
  $limit: Int
  $offset: Int
  $search: String
  $roleNotIn: [UserRoleEnum]
) {
  users(
    where: {
      search: $search
      limit: $limit
      offset: $offset
      roleNotIn: $roleNotIn
    }
  ) {
    nodes {
      databaseId
      firstName
      lastName
      email
      userFields {
        phoneNumber
      }
    }
    pageInfo {
      total
    }
  }
}
`;

function mapSummary(node: UserNode): AdminUserRow {
  return {
    id: node.databaseId.toString(),
    firstName: node.firstName,
    lastName: node.lastName,
    email: node.email,
    phone: node?.userFields?.phoneNumber,
  };
}

const getUsersPageCached = unstable_cache(
  async (params: AdminUsersPageParams) => {
    const { token, page, perPage, search } = params;

    const data = await wpFetch<AdminUsersFetchResponse>(
      USERS_LIST_QUERY,
      {
        limit: perPage,
        offset: (page - 1) * perPage,
        search: search,
        roleNotIn: ["ADMINISTRATOR"],
      },
      { accessToken: token },
    );

    const nodes = data.users?.nodes ?? [];
    const total = data.users?.pageInfo?.total ?? nodes.length;

    return { items: nodes.map(mapSummary), total };
  },
  ["users", "page"],
  { revalidate: LIST_CACHE_REVALIDATE, tags: ["users"] },
);

export async function listUsers(
  params: AdminUsersParams = {},
): Promise<AdminUsersPageRender> {
  const session = await auth();
  const userRole = session?.user?.role;
  const isAdmin = userRole ? ADMIN_ROLES.includes(userRole) : false;
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, params.perPage ?? DEFAULT_PER_PAGE);

  const { items, total } = await getUsersPageCached({
    token: session.user.accessToken,
    page,
    perPage,
    search: params.search,
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);

  return { items, page: safePage, perPage, total, totalPages };
}
