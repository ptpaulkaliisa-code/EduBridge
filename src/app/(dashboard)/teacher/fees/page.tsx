import { TeacherNav } from "@/components/layout/TeacherNav";
import { FeeTable, type FeeTableRow } from "@/components/fees/FeeTable";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";
import { computeBalances } from "@/lib/fees/balance";

// Teacher fee view (PRD 5.5 screen 4, Week 6) — read-only, no payment
// recording. Not in the PRD's Section 9 folder tree (only Section 5.5's
// module spec mentions it), and not scoped to "their classes" since
// Teacher Management (which assigns teachers to classes) isn't built.
export default async function TeacherFeesPage() {
  const profile = await getCurrentProfile();

  let rows: FeeTableRow[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const [{ data: students }, { data: feeStructures }, { data: payments }] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, class_id")
        .eq("school_id", profile.schoolId)
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("fee_structures")
        .select("amount, class_id")
        .eq("school_id", profile.schoolId)
        .eq("academic_year", CURRENT_ACADEMIC_YEAR),
      supabase
        .from("fee_payments")
        .select("student_id, amount_paid")
        .eq("school_id", profile.schoolId),
    ]);

    const balances = computeBalances(students ?? [], feeStructures ?? [], payments ?? []);

    rows = (students ?? []).map((s) => {
      const balance = balances.get(s.id) ?? { totalDue: 0, totalPaid: 0 };
      return { studentName: s.full_name, totalDue: balance.totalDue, totalPaid: balance.totalPaid };
    });
  }

  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Fees</h1>
        <p className="mb-4 text-sm text-[#3A5A66]">Read-only — contact the admin to record a payment.</p>
        {rows.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No students yet.</p>
        ) : (
          <FeeTable rows={rows} />
        )}
      </main>
    </div>
  );
}
