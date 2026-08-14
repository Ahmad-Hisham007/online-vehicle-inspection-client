import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/app/lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "@/app/lib/wp-headers";

// [DEBUG-LAYER-2 START] Temporary diagnostic route.
// Purpose: verify the server-side egress IP and the raw WPGraphQL response
// (status / content-type / sg-captcha header / body snippet) without filling
// the login form. Remove this file once the SiteGround captcha issue is resolved.
export const GET = async () => {
  let egressIp: string | null = null;
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    const ipJson = (await ipRes.json()) as { ip?: string };
    egressIp = ipJson.ip ?? null;
  } catch (e) {
    console.error("[DEBUG] Failed to fetch egress IP:", e);
  }

  let wp: {
    status: number | null;
    statusText: string;
    contentType: string | null;
    sgCaptcha: string | null;
    bodySnippet: string;
  } = {
    status: null,
    statusText: "",
    contentType: null,
    sgCaptcha: null,
    bodySnippet: "",
  };

  try {
    const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: `{ generalSettings { title } }`,
      }),
      cache: "no-store",
    });

    const rawText = await res.text();
    wp = {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
      sgCaptcha: res.headers.get("sg-captcha"),
      bodySnippet: rawText.slice(0, 200),
    };
  } catch (e) {
    wp.statusText = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    egressIp,
    wpUrl: process.env.WORDPRESS_GRAPHQL_URL,
    wp,
    siteOrigin: SITE_ORIGIN,
    siteTokenHeader: WP_SITE_TOKEN_HEADER,
    siteTokenSecretSet: Boolean(process.env.WP_SITE_TOKEN_SECRET),
  });
};
// [DEBUG-LAYER-2 END]