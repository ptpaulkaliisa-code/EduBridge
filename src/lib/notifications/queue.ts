import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils/format";
import type { NotificationType } from "@/types";

// Queues a row in notification_logs (status "pending"). Actual delivery
// happens in a separate worker (PRD 5.9's cron/process-sms) — not built
// in this pass, since it depends on Africa's Talking credentials that
// aren't working yet. This only records the intent to send.
export async function queueSMS(params: {
  schoolId: string;
  recipientPhone: string;
  recipientUserId?: string | null;
  type: NotificationType;
  message: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("notification_logs").insert({
    school_id: params.schoolId,
    recipient_phone: params.recipientPhone,
    recipient_user_id: params.recipientUserId ?? null,
    type: params.type,
    message: params.message,
    status: "pending",
  });
  return { error };
}

// PRD Appendix B templates, adapted: the schema has no school contact
// phone column, so the "Contact the school: [phone]" clause is dropped.
export function attendanceAbsentMessage(schoolName: string, studentName: string, date: string) {
  return `${schoolName}: ${studentName} was marked ABSENT on ${formatDate(date)}. — EduBridge`;
}

export function attendanceLateMessage(schoolName: string, studentName: string, date: string) {
  return `${schoolName}: ${studentName} arrived LATE on ${formatDate(date)}. — EduBridge`;
}

export function gradeMessage(params: {
  schoolName: string;
  studentName: string;
  score: number;
  maxScore: number;
  subjectName: string;
  assessmentName: string;
  classAverage: number;
}) {
  return `${params.schoolName}: ${params.studentName} scored ${params.score}/${params.maxScore} in ${params.subjectName} (${params.assessmentName}). Class avg: ${params.classAverage.toFixed(1)}. — EduBridge`;
}

export function paymentMessage(params: {
  schoolName: string;
  studentName: string;
  amountPaid: number;
  balance: number;
}) {
  return `${params.schoolName}: Payment of UGX ${params.amountPaid.toLocaleString("en-UG")} received for ${params.studentName}. Balance: UGX ${params.balance.toLocaleString("en-UG")}. — EduBridge`;
}
