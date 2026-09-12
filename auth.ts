import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import authConfig from "./auth.config";
import { SITE_ORIGIN } from "@/app/lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "@/app/lib/wp-headers";
import { refreshAccessToken } from "@/app/lib/refresh-token";
import {
  REFRESH_ACCESS_TOKEN_ERROR,
  shouldMarkSessionExpired,
} from "@/app/lib/session-error";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // [DEBUG-LAYER-1 START] Remove these logs once SiteGround captcha issue is resolved
        console.log("[DEBUG] authorize() called for email:", credentials.email);
        console.log("[DEBUG] WP URL:", process.env.WORDPRESS_GRAPHQL_URL);
        console.log(
          "[DEBUG] WP_SITE_TOKEN_HEADER:",
          WP_SITE_TOKEN_HEADER,
          "| secret set:",
          Boolean(process.env.WP_SITE_TOKEN_SECRET),
        );
        console.log("[DEBUG] SITE_ORIGIN:", SITE_ORIGIN);
        // [DEBUG-LAYER-1 END]

        try {
          const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
              Origin: SITE_ORIGIN,
            },
            body: JSON.stringify({
              query: `
                mutation LoginUser($username: String!, $password: String!) {
                  login(input: {
                    provider: PASSWORD,
                    credentials: {
                      username: $username, password: $password
                    }
                  }) {
                    authToken
                    authTokenExpiration
                    refreshToken
                    refreshTokenExpiration
                    user {
                      id
                      name
                      email
                      databaseId
                      roles {
                        nodes {
                          name
                        }
                      }
                    }
                  }
                }
              `,
              variables: {
                username: credentials.email,
                password: credentials.password,
              },
            }),
          });

          // [DEBUG-LAYER-1 START] Remove these logs once SiteGround captcha issue is resolved
          console.log("[DEBUG] Response status:", res.status);
          console.log("[DEBUG] Response statusText:", res.statusText);
          console.log(
            "[DEBUG] Response content-type:",
            res.headers.get("content-type"),
          );
          console.log(
            "[DEBUG] Response sg-captcha header:",
            res.headers.get("sg-captcha"),
          );
          console.log("[DEBUG] Response ok:", res.ok);

          const rawText = await res.text();
          console.log(
            "[DEBUG] Response body (first 200 chars):",
            rawText.slice(0, 200),
          );
          // [DEBUG-LAYER-1 END]

          const isJson = res.headers
            .get("content-type")
            ?.toLowerCase()
            .includes("application/json");

          if (!isJson) {
            // [DEBUG-LAYER-1 START] Remove once issue resolved
            console.log(
              "[DEBUG] NON-JSON RESPONSE (likely SiteGround captcha / 202 HTML). Aborting login.",
            );
            // [DEBUG-LAYER-1 END]
            return null;
          }

          const json = JSON.parse(rawText);

          if (json.errors) {
            console.error("WPGraphQL login errors:", json.errors);
            return null;
          }

          const data = json.data?.login;
          if (data?.authToken) {
            const roles =
              data.user.roles?.nodes?.map((r: { name: string }) => r.name) ||
              [];
            console.log(`[DEBUG] Current user role is ${roles}`);
            return {
              id: data.user.id,
              wpId: data.user.databaseId,
              name: data.user.name,
              email: data.user.email,
              accessToken: data.authToken,
              accessTokenExpiration: data.authTokenExpiration,
              refreshToken: data.refreshToken,
              refreshTokenExpiration: data.refreshTokenExpiration,
              emailVerified: null,
              role: roles[0],
            };
          }

          return null;
        } catch (error) {
          console.error("WPGraphQL login fetch failed:", error);
          // [DEBUG-LAYER-1 START] Remove once issue resolved
          console.error(
            "[DEBUG] Fetch error message:",
            error instanceof Error ? error.message : String(error),
          );
          // [DEBUG-LAYER-1 END]
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.error = undefined;
        return token;
      }

      const current = token.user;
      if (!current?.accessToken || !current.refreshToken) {
        return token;
      }

      const accessExp = current.accessTokenExpiration
        ? current.accessTokenExpiration * 1000
        : 0;

      if (accessExp && Date.now() < accessExp - 60_000) {
        token.error = undefined;
        return token;
      }

      try {
        const refreshed = await refreshAccessToken(current.refreshToken);

        if (!refreshed.success) {
          console.error(
            "[AUTH-JWT-REFRESH-FAILED]",
            JSON.stringify({
              reason:
                refreshed.reason ??
                "refreshToken mutation returned success=false (refresh token expired/revoked/mismatched)",
            }),
          );
          token.error = shouldMarkSessionExpired(refreshed)
            ? REFRESH_ACCESS_TOKEN_ERROR
            : undefined;
          return token;
        }

        token.user = {
          ...current,
          accessToken: refreshed.authToken!,
          accessTokenExpiration:
            refreshed.authTokenExpiration != null
              ? Number(refreshed.authTokenExpiration)
              : current.accessTokenExpiration,
        };
        token.error = undefined;
      } catch (error) {
        console.error(
          "[AUTH-JWT-REFRESH-ERROR]",
          error instanceof Error ? error.message : String(error),
        );
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = token.user as typeof session.user;
      session.error = token.error;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const siteTokenLoginMutation = `
            mutation SiteTokenLogin($email: String!) {
              login(input: {
                provider: SITETOKEN, 
                identity: $email
              }) {
                authToken
                authTokenExpiration
                refreshToken
                refreshTokenExpiration
                user {
                  databaseId
                  email
                  name
                  roles {
                        nodes {
                          name
                        }
                      }
                }
              }
            }
          `;
          console.log("🔍 Google User Email:", user.email);
          console.log(
            "🔑 Site Token Secret Length:",
            process.env.WP_SITE_TOKEN_SECRET?.length || "MISSING!",
          );
          const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET!,
              Origin: SITE_ORIGIN,
            },
            body: JSON.stringify({
              query: siteTokenLoginMutation,
              variables: { email: user.email },
            }),
          });

          const json = await res.json();
          console.log("=== WP SITE TOKEN RESPONSE ===");
          console.log(JSON.stringify(json, null, 2));
          const wpData = json.data?.login;
          console.log(wpData);
          const roles =
            wpData?.user?.roles?.nodes?.map((r: { name: string }) => r.name) ||
            [];
          console.log(roles);
          if (wpData?.authToken) {
            user.accessToken = wpData.authToken;
            user.accessTokenExpiration = wpData.authTokenExpiration;
            user.refreshToken = wpData.refreshToken;
            user.refreshTokenExpiration = wpData.refreshTokenExpiration;
            user.wpId = wpData.user.databaseId;
            user.role = roles[0];
            console.log(user.role);
            return true; // লগিন ১০০% সাকসেসফুল!
          }

          return false;
        } catch (error) {
          console.error("Google Login Error:", error);
          return false;
        }
      }
      return true;
    },
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent login
    updateAge: 24 * 60 * 60, // refresh session once/day
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  events: {
    async signIn() {
      revalidatePath("/", "layout");
    },
    async signOut() {
      revalidatePath("/", "layout");
    },
  },
});
