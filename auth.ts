import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
                login(input: { username: $username, password: $password }) {
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
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
