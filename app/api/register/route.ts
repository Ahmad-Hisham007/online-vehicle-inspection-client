import { NextResponse } from "next/server";

// const salt = bcrypt.genSaltSync(10);

export const POST = async (req: Request) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } =
      await req.json();

    const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation RegisterUser($username: String!, $email: String!, $password: String!, $firstName: String!, $lastName: String!) {
            registerUser(input: {
              username: $username,
              email: $email,
              password: $password,
              firstName: $firstName,
              lastName: $lastName
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
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "Server error during registration",
    });
  }
};
