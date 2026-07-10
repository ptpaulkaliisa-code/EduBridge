import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { updateStudentSchema } from "@/lib/utils/validation";
import { formatPhoneNumber } from "@/lib/utils/format";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/students/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students")
    .select(
      "id, full_name, admission_number, class_id, date_of_birth, gender, parent_phone, parent_id, is_active, classes(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student: data });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/students/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
  if (parsed.data.classId !== undefined) updates.class_id = parsed.data.classId;
  if (parsed.data.admissionNumber !== undefined)
    updates.admission_number = parsed.data.admissionNumber;
  if (parsed.data.dateOfBirth !== undefined) updates.date_of_birth = parsed.data.dateOfBirth;
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender;
  if (parsed.data.parentPhone !== undefined)
    updates.parent_phone = formatPhoneNumber(parsed.data.parentPhone);
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student: data });
}
