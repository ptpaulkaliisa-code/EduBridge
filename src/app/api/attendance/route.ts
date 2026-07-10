import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { submitAttendanceSchema } from "@/lib/utils/validation";
import { queueSMS, attendanceAbsentMessage, attendanceLateMessage } from "@/lib/notifications/queue";

// PRD 6.5 / 5.3 — mark & fetch attendance, scoped to the caller's school
// (RLS, migration 006). Marking absent/late queues an SMS (PRD 5.3).
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");
  if (!classId || !date) {
    return NextResponse.json({ error: "classId and date are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, student_id, status, notes, sms_sent")
    .eq("class_id", classId)
    .eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attendance: data });
}

// Uganda has no DST — always UTC+3. 2pm EAT == 11:00 UTC.
function isLateSubmission(now: Date) {
  return now.getUTCHours() >= 11;
}

function isWeekend(dateStr: string) {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
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
  const parsed = submitAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { classId, date, entries } = parsed.data;

  if (isWeekend(date)) {
    return NextResponse.json({ error: "Attendance can't be marked on a weekend" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("class_id", classId)
    .eq("date", date)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Attendance already submitted for this date" },
      { status: 409 },
    );
  }

  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", profile.schoolId)
    .maybeSingle();
  const schoolName = school?.name ?? "Your school";

  const studentIds = entries.map((e) => e.studentId);
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, parent_id, parent_phone")
    .in("id", studentIds);
  const studentById = new Map((students ?? []).map((s) => [s.id, s]));

  const rows = entries.map((e) => ({
    student_id: e.studentId,
    class_id: classId,
    school_id: profile.schoolId,
    date,
    status: e.status,
    notes: e.notes,
    marked_by: profile.id,
  }));

  const { error: insertError } = await supabase.from("attendance").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  let smsQueuedCount = 0;
  let smsSkippedCount = 0;

  for (const entry of entries) {
    if (entry.status !== "absent" && entry.status !== "late") continue;

    const student = studentById.get(entry.studentId);
    if (!student?.parent_phone) {
      smsSkippedCount++;
      continue;
    }

    const message =
      entry.status === "absent"
        ? attendanceAbsentMessage(schoolName, student.full_name, date)
        : attendanceLateMessage(schoolName, student.full_name, date);

    const { error: queueError } = await queueSMS({
      schoolId: profile.schoolId,
      recipientPhone: student.parent_phone,
      recipientUserId: student.parent_id,
      type: "attendance",
      message,
    });

    if (queueError) {
      smsSkippedCount++;
    } else {
      smsQueuedCount++;
    }
  }

  return NextResponse.json({
    submittedCount: rows.length,
    smsQueuedCount,
    smsSkippedCount,
    lateSubmission: isLateSubmission(new Date()),
  });
}
