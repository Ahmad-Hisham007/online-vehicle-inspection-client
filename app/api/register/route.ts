import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/app/lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "@/app/lib/wp-headers";

// const salt = bcrypt.genSaltSync(10);

export const POST = async (req: Request) => {
  try {
    const { firstName, lastName, email, password } = await req.json();

    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();

    const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: `
          mutation RegisterUser($username: String!, $email: String!, $password: String!, $firstName: String!, $lastName: String!, $displayName: String!) {
            registerUser(input: {
              username: $username,
              email: $email,
              password: $password,
              firstName: $firstName,
              lastName: $lastName,
              displayName: $displayName
            }) {
              user {
                id
              }
            }
          }
        `,
        variables: {
          username: email,
          email,
          password,
          firstName,
          lastName,
          displayName,
        },
      }),
    });

    const result = await res.json();

    if (result.errors) {
      return NextResponse.json({
        status: 400,
        message: result.errors[0].message,
      });
    }

    return NextResponse.json({
      status: 201,
      message: "User registered in WordPress successfully",
    });
  } catch {
    return NextResponse.json({
      status: 500,
      message: "Server error during registration",
    });
  }
};
