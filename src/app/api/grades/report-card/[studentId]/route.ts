import { NextResponse } from "next/server";

// PRD 6.6 — generates a report card PDF. Implemented in Phase 2.
export async function GET(_request: Request, ctx: RouteContext<"/api/grades/report-card/[studentId]">) {
  const { studentId } = await ctx.params;
  return NextResponse.json({ error: "Not implemented", studentId }, { status: 501 });
}
