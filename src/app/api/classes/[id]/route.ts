import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { updateClassSchema } from "@/lib/utils/validation";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/classes/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: klass, error } = await supabase
    .from("classes")
    .select("id, name, level, academic_year, is_active, class_teacher_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!klass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, admission_number, gender, is_active")
    .eq("class_id", id)
    .order("full_name");

  return NextResponse.json({ class: klass, students: students ?? [] });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/classes/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = updateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.level !== undefined) updates.level = parsed.data.level;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.classTeacherId !== undefined) updates.class_teacher_id = parsed.data.classTeacherId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json({ class: data });
}
