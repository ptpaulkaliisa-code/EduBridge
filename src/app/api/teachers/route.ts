import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/session";
import { createTeacherSchema } from "@/lib/utils/validation";
import { formatPhoneNumber } from "@/lib/utils/format";
import { queueSMS, teacherInviteMessage } from "@/lib/notifications/queue";

const ADMIN_ROLES = ["super_admin", "school_admin"];

// Not in the PRD's API table (PRD 5.2 describes the screen, not the
// route), matching the same gap as /api/subjects. Uses the admin
// client for the users insert: users has no INSERT policy for any
// authenticated role (RLS default-denies), by design — only the
// service role and the auth flow's own admin-client calls write here.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: teachers, error } = await admin
    .from("users")
    .select("id, full_name, phone_number, is_active, created_at")
    .eq("school_id", profile.schoolId)
    .eq("role", "teacher")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, class_teacher_id")
    .eq("school_id", profile.schoolId)
    .not("class_teacher_id", "is", null);

  const classesByTeacher = new Map<string, { id: string; name: string }[]>();
  for (const c of classes ?? []) {
    const list = classesByTeacher.get(c.class_teacher_id as string) ?? [];
    list.push({ id: c.id, name: c.name });
    classesByTeacher.set(c.class_teacher_id as string, list);
  }

  return NextResponse.json({
    teachers: (teachers ?? []).map((t) => ({
      ...t,
      classes: classesByTeacher.get(t.id) ?? [],
    })),
  });
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const parsed = createTeacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phoneNumber = formatPhoneNumber(parsed.data.phoneNumber);
  const admin = createAdminClient();

  const { data: teacher, error } = await admin
    .from("users")
    .insert({
      phone_number: phoneNumber,
      full_name: parsed.data.fullName,
      role: "teacher",
      school_id: profile.schoolId,
    })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "That phone number is already registered" : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  const { data: school } = await admin
    .from("schools")
    .select("name")
    .eq("id", profile.schoolId)
    .maybeSingle();

  await queueSMS({
    schoolId: profile.schoolId,
    recipientPhone: phoneNumber,
    recipientUserId: teacher.id,
    type: "reminder",
    message: teacherInviteMessage(school?.name ?? "Your school"),
  });

  return NextResponse.json({ teacher }, { status: 201 });
}
