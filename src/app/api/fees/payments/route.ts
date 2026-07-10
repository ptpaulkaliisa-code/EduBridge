import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { feePaymentSchema } from "@/lib/utils/validation";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";
import { computeBalances } from "@/lib/fees/balance";
import { queueSMS, paymentMessage } from "@/lib/notifications/queue";

// PRD 6.7 / 5.5 screen 2 — record & list fee payments, scoped to the
// caller's school (RLS, migration 010). Recording queues an SMS (PRD
// 5.5 SMS trigger).
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  const supabase = await createClient();
  let query = supabase
    .from("fee_payments")
    .select("id, student_id, amount_paid, payment_date, payment_method, reference_number, created_at")
    .order("payment_date", { ascending: false });

  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payments: data });
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
  const parsed = feePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, class_id, parent_id, parent_phone")
    .eq("id", parsed.data.studentId)
    .maybeSingle();
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { data: payment, error: insertError } = await supabase
    .from("fee_payments")
    .insert({
      student_id: parsed.data.studentId,
      school_id: profile.schoolId,
      amount_paid: parsed.data.amountPaid,
      payment_date: parsed.data.paymentDate,
      payment_method: parsed.data.paymentMethod,
      reference_number: parsed.data.referenceNumber,
      recorded_by: profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const [{ data: feeStructures }, { data: payments }] = await Promise.all([
    supabase
      .from("fee_structures")
      .select("amount, class_id")
      .eq("academic_year", CURRENT_ACADEMIC_YEAR),
    supabase.from("fee_payments").select("student_id, amount_paid").eq("student_id", student.id),
  ]);

  const balances = computeBalances([student], feeStructures ?? [], payments ?? []);
  const balance = balances.get(student.id)?.balance ?? 0;

  let smsQueued = false;
  if (student.parent_phone) {
    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", profile.schoolId)
      .maybeSingle();

    const message = paymentMessage({
      schoolName: school?.name ?? "Your school",
      studentName: student.full_name,
      amountPaid: parsed.data.amountPaid,
      balance,
    });

    const { error: queueError } = await queueSMS({
      schoolId: profile.schoolId,
      recipientPhone: student.parent_phone,
      recipientUserId: student.parent_id,
      type: "fee",
      message,
    });
    smsQueued = !queueError;
  }

  return NextResponse.json({ payment, balance, smsQueued }, { status: 201 });
}
