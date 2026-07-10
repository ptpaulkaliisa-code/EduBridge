import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { studentSchema } from "@/lib/utils/validation";

// PRD 6.4 / 5.2 — students scoped to the caller's school (RLS,
// migration 002), with optional class filter and name/admission search.
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!profile.schoolId) {
    return NextResponse.json({ error: "No school assigned to this account" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = searchParams.get("q");

  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("id, full_name, admission_number, class_id, gender, parent_phone, is_active, classes(name)")
    .eq("school_id", profile.schoolId)
    .order("full_name");

  if (classId) {
    query = query.eq("class_id", classId);
  }
  if (q) {
    query = query.or(`full_name.ilike.%${q}%,admission_number.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ students: data });
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
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert({
      school_id: profile.schoolId,
      class_id: parsed.data.classId,
      full_name: parsed.data.fullName,
      admission_number: parsed.data.admissionNumber,
      date_of_birth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      parent_phone: parsed.data.parentPhone,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: data }, { status: 201 });
}
