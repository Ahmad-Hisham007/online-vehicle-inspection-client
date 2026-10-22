import { NextRequest, NextResponse } from "next/server";
import { submitReInspection } from "@/app/actions/inspection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inspectionId, signature } = body;

    if (!inspectionId || !signature) {
      return NextResponse.json(
        { error: "Missing inspectionId or signature" },
        { status: 400 }
      );
    }

    await submitReInspection(inspectionId, signature);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 }
    );
  }
}