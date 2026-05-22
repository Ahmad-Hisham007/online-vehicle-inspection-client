import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
import authConfig from "./auth.config";

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

        // WordPress WPGraphQL JWT Login Mutation
        const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
                  user {
                    id
                    name
                    email
                    databaseId
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

        const json = await res.json();
        console.log(json);
        const data = json.data?.login;
        console.log(data);
        if (data?.authToken) {
          return {
            id: data.user.id,
            wpId: data.user.databaseId,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.authToken,
            emailVerified: null,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user = token.user;
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
                user {
                  databaseId
                  email
                  name
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
              "X-OVI-0982-Token": process.env.WP_SITE_TOKEN_SECRET!,
              Origin: "http://localhost:3000",
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

          if (wpData?.authToken) {
            user.accessToken = wpData.authToken;
            user.wpId = wpData.user.databaseId;
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
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
