import { auth } from "@/auth";

export async function wpFetch<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
  options?: { accessToken?: string }
): Promise<T> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No valid session");
  }

  const accessToken = options?.accessToken ?? session.user.accessToken;

  const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({ query, variables }),
  });

  // Handle test mocks that may not have text() method
  const rawText = typeof res.text === "function" ? await res.text() : JSON.stringify(await res.json());

  // Handle test mocks that may not have headers
  const contentType = res.headers?.get?.("content-type") ?? "application/json";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    console.error("[wpFetch] NON-JSON response:", res.status, rawText.slice(0, 200));
    throw new Error("WPGraphQL returned non-JSON response (likely captcha)");
  }

  const json = JSON.parse(rawText);

  if (json.errors) {
    const msg = json.errors[0]?.message ?? "WPGraphQL error";
    console.error("[wpFetch] GraphQL errors:", json.errors);
    throw new Error(msg);
  }

  return json.data;
}