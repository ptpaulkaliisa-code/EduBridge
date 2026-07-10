import { NextResponse } from "next/server";
import { otpRequestSchema } from "@/lib/utils/validation";
import { formatPhoneNumber } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PRD 5.1 / 6.1 — sends an OTP via Supabase phone auth, but only if the
// phone is already registered by a school admin. No self-signup.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phoneNumber = formatPhoneNumber(parsed.data.phoneNumber);

  const admin = createAdminClient();
  const { data: existingUser, error: lookupError } = await admin
    .from("users")
    .select("id")
    .eq("phone_number", phoneNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "Failed to look up account" }, { status: 500 });
  }

  if (!existingUser) {
    return NextResponse.json(
      { error: "Account not found — contact your school admin" },
      { status: 404 },
    );
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
    options: { shouldCreateUser: true },
  });

  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, phoneNumber });
}
