import { NextResponse } from "next/server";

// PRD 6.11 — SMS delivery logs (admin only). Implemented in Week 4.
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
