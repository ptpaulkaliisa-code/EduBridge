import Link from "next/link";
import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { RecordPaymentModal } from "@/components/fees/RecordPaymentModal";
import { formatUGX } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";
import { computeBalances } from "@/lib/fees/balance";

// Admin fee overview & payment recording (PRD 5.5 screens 2+3, Week 6).
// This covers "select student, see balance, record payment" (screen 2)
// plus a per-student status list; the fuller screen-3 feature set
// (total expected vs collected, CSV export, "never paid" filter) isn't
// built this pass — not part of this round's explicit scope.
export default async function AdminFeesPage() {
  const profile = await getCurrentProfile();

  let rows: {
    id: string;
    fullName: string;
    className: string;
    totalDue: number;
    totalPaid: number;
  }[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const [{ data: students }, { data: feeStructures }, { data: payments }] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, class_id, classes(name)")
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
      return {
        id: s.id,
        fullName: s.full_name,
        className: (s.classes as unknown as { name: string } | null)?.name ?? "—",
        totalDue: balance.totalDue,
        totalPaid: balance.totalPaid,
      };
    });
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Fees</h1>
          <Link
            href="/admin/fees/structure"
            className="rounded-lg border border-[#114C5A] px-4 py-2 text-sm font-medium text-[#114C5A]"
          >
            Fee structure
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No students yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const balance = r.totalDue - r.totalPaid;
                const status = balance <= 0 ? "success" : r.totalPaid > 0 ? "warning" : "danger";
                const label = balance <= 0 ? "Paid" : r.totalPaid > 0 ? "Partial" : "Unpaid";
                return (
                  <tr key={r.id}>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell>{r.className}</TableCell>
                    <TableCell>{formatUGX(r.totalDue)}</TableCell>
                    <TableCell>{formatUGX(r.totalPaid)}</TableCell>
                    <TableCell>
                      <Badge tone={status}>{label}</Badge>
                    </TableCell>
                    <TableCell>
                      <RecordPaymentModal
                        studentId={r.id}
                        studentName={r.fullName}
                        totalDue={r.totalDue}
                        totalPaid={r.totalPaid}
                      />
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
