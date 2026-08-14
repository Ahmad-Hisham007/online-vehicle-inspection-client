import type { Metadata } from "next";
import { Figtree, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToasterProvider } from "./components/ToasterProvider";
import SessionWrapper from "./components/SessionWrapper";
import Header from "./components/Header/Header";
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

async function getSiteSettings(): Promise<{ title: string; description: string }> {
  const fallback = {
    title: "Online Vehicle Inspection",
    description: "Online vehicle inspection platform",
  };

  const url = process.env.WORDPRESS_GRAPHQL_URL;
  if (!url) return fallback;

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

    if (!res.ok) return fallback;

    const json = (await res.json()) as GeneralSettings;
    const settings = json.data?.generalSettings;

    return {
      title: settings?.title?.trim() || fallback.title,
      description: settings?.description?.trim() || fallback.description,
    };
  } catch {
    return fallback;
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
        <ToasterProvider />
        <SessionWrapper>
          <Header />
          <main>{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
