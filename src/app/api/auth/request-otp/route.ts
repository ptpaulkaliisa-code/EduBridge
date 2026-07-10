import { NextResponse } from "next/server";
import { otpRequestSchema } from "@/lib/utils/validation";

// PRD 6.1 — sends an OTP via Supabase phone auth. Implemented in Week 2.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
