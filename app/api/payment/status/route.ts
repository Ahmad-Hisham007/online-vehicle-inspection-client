import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/app/lib/site-origin";
import { WP_SITE_TOKEN_HEADER } from "@/app/lib/wp-headers";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const inspectionId = searchParams.get("inspectionId");

    if (!inspectionId) {
      return NextResponse.json(
        { error: "inspectionId is required" },
        { status: 400 },
      );
    }

    const res = await fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WP_SITE_TOKEN_HEADER]: process.env.WP_SITE_TOKEN_SECRET || "",
        Origin: SITE_ORIGIN,
      },
      body: JSON.stringify({
        query: `
          query GetInspectionStatus($id: ID!) {
            inspection(id: $id) {
              inspectionDetails {
                inspectionStatus
                paymentStatus
              }
            }
          }
        `,
        variables: { id: inspectionId },
      }),
      cache: "no-store",
    });

    const json = await res.json();

    if (json.errors) {
      console.error("WPGraphQL payment status query errors:", json.errors);
      return NextResponse.json(
        { error: "Failed to fetch inspection status" },
        { status: 500 },
      );
    }

    const inspectionDetails = json.data?.inspection?.inspectionDetails;

    if (!inspectionDetails) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      inspectionStatus: inspectionDetails.inspectionStatus,
      paymentStatus: inspectionDetails.paymentStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error fetching payment status" },
      { status: 500 },
    );
  }
};
