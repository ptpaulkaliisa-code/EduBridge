import { NextResponse } from "next/server";
import { otpVerifySchema } from "@/lib/utils/validation";
import { formatPhoneNumber } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_HOME } from "@/lib/supabase/middleware";

// PRD 5.1 / 6.1 — verifies the OTP, links auth_id to the existing users
// row on first verification, and returns where to redirect based on role.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phoneNumber = formatPhoneNumber(parsed.data.phoneNumber);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: parsed.data.otp,
    type: "sms",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid or expired code" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("id, role, auth_id")
    .eq("phone_number", phoneNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Account not found — contact your school admin" },
      { status: 404 },
    );
  }

  await admin
    .from("users")
    .update({
      auth_id: profile.auth_id ?? data.user.id,
      last_login: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const redirectTo = ROLE_HOME[profile.role] ?? "/";

  return NextResponse.json({ success: true, redirectTo });
}
