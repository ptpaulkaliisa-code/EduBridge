import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/session";

const ADMIN_ROLES = ["super_admin", "school_admin"];

// PRD 6.11 — SMS logs (admin only). Uses the admin client since
// notification_logs has no RLS policy (it's a system table, not
// per-user data); access is gated here by role instead.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notification_logs")
    .select("id, recipient_phone, type, message, status, cost, sent_at, created_at")
    .eq("school_id", profile.schoolId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
