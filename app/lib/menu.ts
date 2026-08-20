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
  query GetMainMenu {
    menu(id: "Main Menu", idType: NAME) {
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

const MENU_CACHE_REVALIDATE = 86400; // seconds (24h — menu is static content)
const MENU_MEMO_TTL_MS = MENU_CACHE_REVALIDATE * 1000;

let menuMemo: { items: NavMenuItem[]; timestamp: number } | null = null;

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

export async function getMainMenu(): Promise<NavMenuItem[]> {
  if (menuMemo && Date.now() - menuMemo.timestamp < MENU_MEMO_TTL_MS) {
    return menuMemo.items;
  }

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
      body: JSON.stringify({ query: MENU_QUERY }),
      next: { revalidate: MENU_CACHE_REVALIDATE },
    });

    if (!res.ok) return menuMemo?.items ?? [];

    const json = (await res.json()) as MenuResponse;
    const nodes = json.data?.menu?.menuItems?.nodes;

    if (!nodes) return menuMemo?.items ?? [];

    const items = nodes.map(mapNode);
    menuMemo = { items, timestamp: Date.now() };
    return items;
  } catch {
    return menuMemo?.items ?? [];
  }
}