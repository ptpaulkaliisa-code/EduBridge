import { NextResponse } from "next/server";

// PRD 6.2 — super admin only. Implemented in Week 3.
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
