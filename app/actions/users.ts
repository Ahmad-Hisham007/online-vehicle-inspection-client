"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { AdminUserDetail, AdminUserRow } from "../lib/types";
import { wpFetch } from "../lib/wp-auth";
import { auth } from "@/auth";
import { assertSessionActive } from "../lib/refresh-token";
import { isAdministrator } from "../lib/access";

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

// ---------------------------------------------------------------------------
// Single user (admin-only) — edit page
// ---------------------------------------------------------------------------

interface UserDetailNode {
  databaseId: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  registeredDate?: string | null;
  roles?: { nodes: { name: string }[] } | null;
  userFields?: userField;
}

interface GetUserResponse {
  user: UserDetailNode | null;
}

const USER_DETAIL_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      databaseId
      email
      firstName
      lastName
      registeredDate
      roles {
        nodes {
          name
        }
      }
      userFields {
        phoneNumber
      }
    }
  }
`;

interface UserDetailParams {
  token: string;
  id: string;
}

const getUserCached = unstable_cache(
  async (params: UserDetailParams): Promise<AdminUserDetail> => {
    const data = await wpFetch<GetUserResponse>(
      USER_DETAIL_QUERY,
      { id: params.id },
      { accessToken: params.token },
    );

    const node = data.user;
    if (!node) {
      throw new Error("User not found");
    }

    return {
      id: node.databaseId.toString(),
      email: node.email,
      firstName: node.firstName ?? "",
      lastName: node.lastName ?? "",
      phone:
        node.userFields?.phoneNumber != null
          ? String(node.userFields.phoneNumber)
          : "",
      role: node.roles?.nodes?.[0]?.name ?? "customer",
      registeredDate: node.registeredDate ?? "",
    };
  },
  ["users", "detail"],
  { revalidate: LIST_CACHE_REVALIDATE, tags: ["users"] },
);

export async function getUser(id: string): Promise<AdminUserDetail> {
  const session = await auth();
  if (!session?.user?.accessToken || !isAdministrator(session.user.role)) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  return getUserCached({ token: session.user.accessToken, id });
}

interface UpdateUserResponse {
  updateUser?: {
    user?: { databaseId?: number } | null;
  } | null;
}

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        databaseId
      }
    }
  }
`;

export interface UpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.accessToken || !isAdministrator(session.user.role)) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  // NOTE: phoneNumber is an ACF user field and is NOT part of UpdateUserInput
  // (only RegisterUserInput was extended via WP snippet #277). Persisting phone
  // edits needs a WP-side extension; the form collects it but does not send it yet.
  const data = await wpFetch<UpdateUserResponse>(UPDATE_USER_MUTATION, {
    input: {
      id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roles: [payload.role.toUpperCase()],
    },
  });

  if (!data.updateUser?.user) {
    throw new Error("Failed to update user");
  }

  revalidateTag("users", "max");
}
