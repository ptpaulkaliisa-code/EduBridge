// A student owes every fee_structure that applies to their class, plus
// every school-wide one (class_id IS NULL), across the whole academic
// year — not scoped to a single term. Terms have due dates but this
// treats fees as one running account, matching the single "Fees: UGX X
// DUE" figure in the PRD's parent dashboard mockup (8.4) rather than
// trying to reconcile a payment against a specific term's items.

export interface FeeBalance {
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export function computeBalances(
  students: { id: string; class_id: string | null }[],
  feeStructures: { amount: number | string; class_id: string | null }[],
  payments: { student_id: string; amount_paid: number | string }[],
): Map<string, FeeBalance> {
  const paidByStudent = new Map<string, number>();
  for (const p of payments) {
    paidByStudent.set(
      p.student_id,
      (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount_paid),
    );
  }

  const dueByClass = new Map<string, number>();
  let schoolWideDue = 0;
  for (const f of feeStructures) {
    if (f.class_id === null) {
      schoolWideDue += Number(f.amount);
    } else {
      dueByClass.set(f.class_id, (dueByClass.get(f.class_id) ?? 0) + Number(f.amount));
    }
  }

  const result = new Map<string, FeeBalance>();
  for (const s of students) {
    const totalDue = schoolWideDue + (s.class_id ? (dueByClass.get(s.class_id) ?? 0) : 0);
    const totalPaid = paidByStudent.get(s.id) ?? 0;
    result.set(s.id, { totalDue, totalPaid, balance: totalDue - totalPaid });
  }
  return result;
}
