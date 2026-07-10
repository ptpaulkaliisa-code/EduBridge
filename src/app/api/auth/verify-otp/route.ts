import { NextResponse } from "next/server";
import { otpVerifySchema } from "@/lib/utils/validation";

// PRD 6.1 — verifies OTP and returns a Supabase session. Implemented in Week 2.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
