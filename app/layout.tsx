import type { Metadata } from "next";
import { Figtree, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToasterProvider } from "./components/ToasterProvider";
import SessionWrapper from "./components/SessionWrapper";
import NavigationLoader from "./components/NavigationLoader";
import { SITE_ORIGIN } from "./lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "./lib/wp-headers";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS variable name
});

interface GeneralSettings {
  data?: {
    generalSettings?: {
      title?: string | null;
      description?: string | null;
    } | null;
  } | null;
}

const SETTINGS_MEMO_TTL_MS = 3600 * 1000;

let settingsMemo: { settings: { title: string; description: string }; timestamp: number } | null =
  null;

async function getSiteSettings(): Promise<{ title: string; description: string }> {
  const fallback = {
    title: "Online Vehicle Inspection",
    description: "Online vehicle inspection platform",
  };

  if (settingsMemo && Date.now() - settingsMemo.timestamp < SETTINGS_MEMO_TTL_MS) {
    return settingsMemo.settings;
  }

  const url = process.env.WORDPRESS_GRAPHQL_URL;
  if (!url) return settingsMemo?.settings ?? fallback;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: `
          {
            generalSettings {
              title
              description
            }
          }
        `,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return settingsMemo?.settings ?? fallback;

    const json = (await res.json()) as GeneralSettings;
    const settings = json.data?.generalSettings;

    const result = {
      title: settings?.title?.trim() || fallback.title,
      description: settings?.description?.trim() || fallback.description,
    };

    settingsMemo = { settings: result, timestamp: Date.now() };
    return result;
  } catch {
    return settingsMemo?.settings ?? fallback;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSiteSettings();

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      siteName: title,
      type: "website",
      url: SITE_ORIGIN,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", figtree.variable, inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <NavigationLoader />
        <ToasterProvider />
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
