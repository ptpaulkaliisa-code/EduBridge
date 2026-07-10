import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { updateAttendanceSchema } from "@/lib/utils/validation";

const ADMIN_ROLES = ["super_admin", "school_admin"];

// PRD 6.5 — admin override of a single attendance record, with the
// reason logged into notes (PRD 5.3 business rules).
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/attendance/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = updateAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .update({ status: parsed.data.status, notes: parsed.data.notes })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }

  return NextResponse.json({ attendance: data });
}
