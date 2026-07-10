import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendSMS } from "@/lib/africastalking/sms";

interface SendSMSHookPayload {
  user: { phone: string };
  sms: { otp: string };
}

// Supabase's Send SMS Hook — called by Supabase Auth instead of a built-in
// SMS provider (Twilio/MessageBird/Vonage) so OTPs go out through Africa's
// Talking, per PRD 3.1/3.3. Configured via hook_send_sms_{enabled,uri,secrets}
// in the project's Auth config.
export async function POST(request: Request) {
  const secret = process.env.SEND_SMS_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { http_code: 500, message: "SMS hook not configured" } },
      { status: 500 },
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let payload: SendSMSHookPayload;
  try {
    const wh = new Webhook(secret.replace("v1,whsec_", ""));
    payload = wh.verify(body, headers) as SendSMSHookPayload;
  } catch {
    return NextResponse.json(
      { error: { http_code: 401, message: "Invalid webhook signature" } },
      { status: 401 },
    );
  }

  const message = `Your EduBridge Africa login code is ${payload.sms.otp}`;
  const result = await sendSMS(payload.user.phone, message);

  if (!result.success) {
    return NextResponse.json(
      { error: { http_code: 500, message: `Failed to send SMS: ${result.error}` } },
      { status: 500 },
    );
  }

  return NextResponse.json({});
}
