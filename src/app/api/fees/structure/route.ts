import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { createFeeStructureSchema } from "@/lib/utils/validation";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

// PRD 6.7 / 5.5 screen 1 — fee items scoped to the caller's school
// (RLS, migration 010). class_id null means "applies to all classes".
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get("academicYear") ?? CURRENT_ACADEMIC_YEAR;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_structures")
    .select("id, name, amount, term, academic_year, class_id, due_date, classes(name)")
    .eq("academic_year", academicYear)
    .order("term")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feeStructures: data });
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
  const parsed = createFeeStructureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_structures")
    .insert({
      school_id: profile.schoolId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      term: parsed.data.term,
      academic_year: parsed.data.academicYear,
      class_id: parsed.data.classId ?? null,
      due_date: parsed.data.dueDate,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feeStructure: data }, { status: 201 });
}
