import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { createAnnouncementSchema } from "@/lib/utils/validation";
import { queueSMS, announcementMessage } from "@/lib/notifications/queue";

const STAFF_ROLES = ["super_admin", "school_admin", "teacher"];

// PRD 6.8 / 5.6 — announcements CRUD. GET relies entirely on RLS
// (migration 011) to scope results — staff see everything in their
// school, parents see school-wide (class_id null) + their child's
// class, no role branching needed here. The fuller PRD 5.6 screen
// (rich text, scheduling) is still Phase 2; the SMS toggle + cost
// estimate below is not.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, class_id, created_at, classes(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcements: data });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      school_id: profile.schoolId,
      class_id: parsed.data.classId ?? null,
      title: parsed.data.title,
      body: parsed.data.body,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let smsQueuedCount = 0;

  if (parsed.data.sendSms) {
    let studentsQuery = supabase
      .from("students")
      .select("full_name, parent_id, parent_phone")
      .eq("school_id", profile.schoolId)
      .eq("is_active", true);
    if (parsed.data.classId) {
      studentsQuery = studentsQuery.eq("class_id", parsed.data.classId);
    }
    const { data: students } = await studentsQuery;

    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", profile.schoolId)
      .maybeSingle();
    const message = announcementMessage(school?.name ?? "Your school", parsed.data.title, parsed.data.body);

    for (const student of students ?? []) {
      if (!student.parent_phone) continue;
      const { error: queueError } = await queueSMS({
        schoolId: profile.schoolId,
        recipientPhone: student.parent_phone,
        recipientUserId: student.parent_id,
        type: "announcement",
        message,
      });
      if (!queueError) smsQueuedCount++;
    }
  }

  return NextResponse.json({ announcement: data, smsQueuedCount }, { status: 201 });
}
