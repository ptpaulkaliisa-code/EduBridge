import { NextResponse } from "next/server";

// PRD 5.9 & 11.2 — processes the pending SMS queue, runs every 5 minutes
// via Vercel Cron (see vercel.json). Implemented in Week 4.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
