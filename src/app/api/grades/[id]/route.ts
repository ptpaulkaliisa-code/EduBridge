import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { updateGradeSchema } from "@/lib/utils/validation";

// PRD 6.6 — edit a single grade (typo fixes etc.). Unlike attendance's
// PATCH, the PRD doesn't restrict this to admins, so any authenticated
// staff account (teacher or admin) scoped to the school can use it.
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/grades/[id]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = updateGradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.score !== undefined) updates.score = parsed.data.score;
  if (parsed.data.maxScore !== undefined) updates.max_score = parsed.data.maxScore;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grades")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Grade not found" }, { status: 404 });
  }

  return NextResponse.json({ grade: data });
}
