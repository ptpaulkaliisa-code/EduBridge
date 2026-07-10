import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";
import { computeBalances } from "@/lib/fees/balance";

// PRD 6.7 — per-student fee balance.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/fees/balance/[studentId]">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { studentId } = await ctx.params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, class_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const [{ data: feeStructures }, { data: payments }] = await Promise.all([
    supabase
      .from("fee_structures")
      .select("amount, class_id")
      .eq("academic_year", CURRENT_ACADEMIC_YEAR),
    supabase.from("fee_payments").select("student_id, amount_paid").eq("student_id", studentId),
  ]);

  const balances = computeBalances([student], feeStructures ?? [], payments ?? []);
  const balance = balances.get(studentId) ?? { totalDue: 0, totalPaid: 0, balance: 0 };

  return NextResponse.json(balance);
}
