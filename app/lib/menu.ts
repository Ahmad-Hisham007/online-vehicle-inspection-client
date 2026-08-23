import { unstable_cache } from "next/cache";
import { WP_SITE_TOKEN_HEADER } from "./wp-headers";
import { SITE_ORIGIN } from "./site-origin";

export interface NavMenuItem {
  id: string;
  databaseId: number;
  label: string;
  url: string;
  path: string;
  target: string | null;
  parentId: string | null;
  order: number;
  cssClasses: string[];
  childItems?: NavMenuItem[];
}

interface MenuItemNode {
  id: string;
  databaseId: number;
  label: string;
  url: string;
  path: string;
  target: string | null;
  parentId: string | null;
  order: number;
  cssClasses: string[];
  childItems?: { nodes?: MenuItemNode[] };
}

interface MenuResponse {
  data?: {
    menu?: {
      menuItems?: {
        nodes?: MenuItemNode[];
      } | null;
    } | null;
  } | null;
}

const MENU_QUERY = `
  query GetMenu($slug: ID!) {
    menu(id: $slug, idType: NAME) {
      name
      locations
      menuItems {
        nodes {
          id
          databaseId
          label
          url
          path
          target
          parentId
          order
          cssClasses
          childItems {
            nodes {
              id
              databaseId
              label
              url
              path
              target
              parentId
              order
              cssClasses
            }
          }
        }
      }
    }
  }
`;

const MENU_CACHE_REVALIDATE = 300; // seconds (5 min — admin edits menu in WP)

function mapNode(node: MenuItemNode): NavMenuItem {
  return {
    id: node.id,
    databaseId: node.databaseId,
    label: node.label,
    url: node.url,
    path: node.path,
    target: node.target,
    parentId: node.parentId,
    order: node.order,
    cssClasses: node.cssClasses ?? [],
    childItems: node.childItems?.nodes?.map(mapNode) ?? [],
  };
}

async function fetchMenu(slug: string): Promise<NavMenuItem[]> {
  const url = process.env.WORDPRESS_GRAPHQL_URL;
  if (!url) return [];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: MENU_QUERY,
        variables: { slug },
      }),
    });

    if (!res.ok) return [];

    const json = (await res.json()) as MenuResponse;
    const nodes = json.data?.menu?.menuItems?.nodes;

    if (!nodes) return [];

    return nodes.map(mapNode);
  } catch {
    return [];
  }
}

export const getMenu = unstable_cache(
  async (slug: string) => fetchMenu(slug),
  ["menu", "slug"],
  { revalidate: MENU_CACHE_REVALIDATE },
);

export async function getMainMenu(): Promise<NavMenuItem[]> {
  return getMenu("Main Menu");
}

export async function getAdminSiteMenu(): Promise<NavMenuItem[]> {
  return getMenu("Admin Site Menu");
}

export async function getAdminPanelMenu(): Promise<NavMenuItem[]> {
  return getMenu("Admin Panel Menu");
}
