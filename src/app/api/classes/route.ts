import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { createClassSchema } from "@/lib/utils/validation";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

// PRD 6.3 / 5.2 — classes scoped to the caller's school (enforced by
// RLS, migration 005, in addition to the explicit filter below).
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, level, academic_year, is_active, class_teacher_id, students(count)")
    .eq("school_id", profile.schoolId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ classes: data });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert({
      school_id: profile.schoolId,
      name: parsed.data.name,
      level: parsed.data.level,
      academic_year: CURRENT_ACADEMIC_YEAR,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ class: data }, { status: 201 });
}
