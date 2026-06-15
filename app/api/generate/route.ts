import { NextResponse } from "next/server";

export const runtime = "nodejs";

// RETIRED endpoint. The scripted demo draft-generation step has been removed.
// The canonical structured execution gate now lives in the main Zorelan app
// at https://zorelan.com/demo (backed by POST /v1/evaluate).
const CANONICAL_DEMO = "https://zorelan.com/demo";

function gone() {
  return NextResponse.json(
    {
      ok: false,
      error: "deprecated",
      message:
        "This demo endpoint has been retired. Use the canonical demo instead.",
      canonical_demo: CANONICAL_DEMO,
    },
    { status: 410 }
  );
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}
