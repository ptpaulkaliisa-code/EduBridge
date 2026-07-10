import { NextResponse } from "next/server";

// PRD 6.7 — per-student fee balance. Implemented in Week 6.
export async function GET(_request: Request, ctx: RouteContext<"/api/fees/balance/[studentId]">) {
  const { studentId } = await ctx.params;
  return NextResponse.json({ error: "Not implemented", studentId }, { status: 501 });
}
