import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/app/lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "@/app/lib/wp-headers";

const generateUniqueUsername = (
  email: string,
  firstName?: string,
  lastName?: string,
): string => {
  let rawBase = [firstName, lastName].filter(Boolean).join("");
  if (!rawBase) {
    rawBase = email.split("@")[0];
  }

  const cleanBase = rawBase.toLowerCase().replace(/[^a-z0-9]/g, "");

  const randomSuffix = globalThis.crypto.randomUUID().split("-")[0];

  return `${cleanBase}_${randomSuffix}`;
};

export const POST = async (req: Request) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } =
      await req.json();

    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const autoUsername = generateUniqueUsername(email, firstName, lastName);
    const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: `
          mutation RegisterUser(
  $username: String!, 
  $email: String!, 
  $password: String!, 
  $firstName: String!, 
  $lastName: String!, 
  $displayName: String!
  $phoneNumber: String!
) {
   registerUser(input: {
              username: $username,
              email: $email,
              password: $password,
              firstName: $firstName,
              lastName: $lastName,
              displayName: $displayName,
     phoneNumber: $phoneNumber
            })
           {
    user {
          id
            }
            }
          }
        `,
        variables: {
          username: autoUsername,
          email,
          password,
          firstName,
          lastName,
          displayName,
          phoneNumber,
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
