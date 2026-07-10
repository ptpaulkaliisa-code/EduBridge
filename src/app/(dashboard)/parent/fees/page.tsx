import { ParentNav } from "@/components/layout/ParentNav";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { FeeBalance } from "@/components/fees/FeeBalance";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { getCurrentProfile } from "@/lib/supabase/session";
import { getParentChildren } from "@/lib/supabase/parent";
import { createClient } from "@/lib/supabase/server";
import { formatUGX, formatDate } from "@/lib/utils/format";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";
import { computeBalances } from "@/lib/fees/balance";

// Parent fee view (PRD 5.5 screen 5, Week 7): balance summary,
// per-fee-item breakdown, payment history. No "Pay via MoMo" button —
// that's explicitly Phase 2 in the PRD itself.
export default async function ParentFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const { childId: childIdParam } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const children = await getParentChildren(profile.id);
  const currentChild = children.find((c) => c.id === childIdParam) ?? children[0];

  let totalDue = 0;
  let totalPaid = 0;
  let items: { id: string; name: string; amount: number; term: number; due_date: string | null }[] = [];
  let payments: {
    id: string;
    amount_paid: number;
    payment_date: string;
    payment_method: string | null;
  }[] = [];

  if (currentChild) {
    const supabase = await createClient();

    const [{ data: feeStructures }, { data: paymentData }] = await Promise.all([
      supabase
        .from("fee_structures")
        .select("id, name, amount, term, due_date, class_id")
        .eq("academic_year", CURRENT_ACADEMIC_YEAR),
      supabase
        .from("fee_payments")
        .select("id, amount_paid, payment_date, payment_method")
        .eq("student_id", currentChild.id)
        .order("payment_date", { ascending: false }),
    ]);

    const applicable = (feeStructures ?? []).filter(
      (f) => f.class_id === null || f.class_id === currentChild.classId,
    );
    items = applicable;
    payments = paymentData ?? [];

    const balances = computeBalances(
      [{ id: currentChild.id, class_id: currentChild.classId }],
      applicable,
      payments.map((p) => ({ student_id: currentChild.id, amount_paid: p.amount_paid })),
    );
    const balance = balances.get(currentChild.id);
    totalDue = balance?.totalDue ?? 0;
    totalPaid = balance?.totalPaid ?? 0;
  }

  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Fees</h1>
          {currentChild && (
            <ChildSelector
              options={children.map((c) => ({ id: c.id, fullName: c.fullName }))}
              currentChildId={currentChild.id}
            />
          )}
        </div>

        {!currentChild ? (
          <p className="text-sm text-[#3A5A66]">
            No children are linked to your account yet — contact your school admin.
          </p>
        ) : (
          <>
            <div className="mb-6 max-w-xs">
              <FeeBalance totalDue={totalDue} totalPaid={totalPaid} />
            </div>

            <p className="mb-2 text-sm text-[#3A5A66]">Fee items</p>
            {items.length === 0 ? (
              <p className="mb-6 text-sm text-[#3A5A66]">No fee items set for this year yet.</p>
            ) : (
              <div className="mb-6">
                <Table>
                  <thead>
                    <tr>
                      <TableHead>Item</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due date</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>Term {item.term}</TableCell>
                        <TableCell>{formatUGX(item.amount)}</TableCell>
                        <TableCell>{item.due_date ? formatDate(item.due_date) : "—"}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            <p className="mb-2 text-sm text-[#3A5A66]">Payment history</p>
            {payments.length === 0 ? (
              <p className="text-sm text-[#3A5A66]">No payments recorded yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell>{formatUGX(p.amount_paid)}</TableCell>
                      <TableCell className="capitalize">
                        {p.payment_method?.replace("_", " ") ?? "—"}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </main>
    </div>
  );
}
