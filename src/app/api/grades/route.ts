import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { submitGradesSchema } from "@/lib/utils/validation";
import { queueSMS, gradeMessage } from "@/lib/notifications/queue";

// PRD 6.6 / 5.4 — grades scoped to the caller's school (RLS, migration
// 008). Submitting queues an SMS per student (PRD 5.4 SMS trigger).
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const assessmentName = searchParams.get("assessmentName");
  const term = searchParams.get("term");
  const academicYear = searchParams.get("academicYear");

  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("grades")
    .select("id, student_id, assessment_name, score, max_score, term, academic_year")
    .eq("subject_id", subjectId);

  if (assessmentName) query = query.eq("assessment_name", assessmentName);
  if (term) query = query.eq("term", Number(term));
  if (academicYear) query = query.eq("academic_year", academicYear);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ grades: data });
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
  const parsed = submitGradesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { subjectId, assessmentName, maxScore, term, academicYear, entries } = parsed.data;

  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
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

  const classAverage =
    entries.reduce((sum, e) => sum + e.score, 0) / entries.length;

  const rows = entries.map((e) => ({
    student_id: e.studentId,
    subject_id: subjectId,
    school_id: profile.schoolId,
    assessment_name: assessmentName,
    score: e.score,
    max_score: maxScore,
    term,
    academic_year: academicYear,
    entered_by: profile.id,
  }));

  const { error: upsertError } = await supabase
    .from("grades")
    .upsert(rows, { onConflict: "student_id,subject_id,assessment_name,term,academic_year" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  let smsQueuedCount = 0;
  let smsSkippedCount = 0;

  for (const entry of entries) {
    const student = studentById.get(entry.studentId);
    if (!student?.parent_phone) {
      smsSkippedCount++;
      continue;
    }

    const message = gradeMessage({
      schoolName,
      studentName: student.full_name,
      score: entry.score,
      maxScore,
      subjectName: subject.name,
      assessmentName,
      classAverage,
    });

    const { error: queueError } = await queueSMS({
      schoolId: profile.schoolId,
      recipientPhone: student.parent_phone,
      recipientUserId: student.parent_id,
      type: "grade",
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
    classAverage,
    smsQueuedCount,
    smsSkippedCount,
  });
}
