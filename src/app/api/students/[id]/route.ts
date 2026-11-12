import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { updateStudentSchema } from "@/lib/utils/validation";
import { formatPhoneNumber } from "@/lib/utils/format";
import {
  linkParentAccount,
  queueParentWelcome,
  type ParentLinkResult,
} from "@/lib/parents/link";

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
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

  const supabase = await createClient();

  // A new parent phone moves the student to that number's parent login
  // (created if needed); the previous parent loses access to this child.
  let parentLink: ParentLinkResult | null = null;
  const parentPhone =
    parsed.data.parentPhone !== undefined
      ? formatPhoneNumber(parsed.data.parentPhone)
      : undefined;
  if (parentPhone) {
    const { data: current } = await supabase
      .from("students")
      .select("full_name")
      .eq("id", id)
      .maybeSingle();
    if (!current) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    try {
      parentLink = await linkParentAccount({
        phoneNumber: parentPhone,
        parentName: parsed.data.parentName,
        studentName: parsed.data.fullName ?? current.full_name,
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
    updates.parent_phone = parentPhone;
    updates.parent_id = parentLink.parentId;
  }

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

  if (parentPhone && parentLink?.created && parentLink.parentId) {
    await queueParentWelcome({
      schoolId: data.school_id,
      phoneNumber: parentPhone,
      parentId: parentLink.parentId,
      studentName: data.full_name,
    });
  }

  return NextResponse.json({ student: data, warning: parentLink?.warning });
}
