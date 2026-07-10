import { NextResponse } from "next/server";

// PRD 6.11 — queues an SMS onto notification_logs. Implemented in Week 4.
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
