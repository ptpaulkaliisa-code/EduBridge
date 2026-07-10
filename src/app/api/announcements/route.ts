import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { createAnnouncementSchema } from "@/lib/utils/validation";

const STAFF_ROLES = ["super_admin", "school_admin", "teacher"];

// PRD 6.8 / 5.6 — minimal announcements CRUD, built here only because
// Week 7's parent portal needs a real list to show; the fuller PRD 5.6
// screen (rich text, SMS toggle + cost estimate, scheduling) is
// otherwise Phase 2. GET relies entirely on RLS (migration 011) to
// scope results — staff see everything in their school, parents see
// school-wide (class_id null) + their child's class, no role branching
// needed here.
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

  return NextResponse.json({ announcement: data }, { status: 201 });
}
