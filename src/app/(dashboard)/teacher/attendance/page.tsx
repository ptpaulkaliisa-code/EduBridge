"use client";

import { useEffect, useState } from "react";
import { TeacherNav } from "@/components/layout/TeacherNav";
import { AttendanceForm, type AttendanceFormStudent } from "@/components/attendance/AttendanceForm";
import type { AttendanceStatus } from "@/types";

interface ClassOption {
  id: string;
  name: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Teacher attendance marking (PRD 5.3 / 7.2, Week 4). Classes aren't
// filtered by class_teacher_id — Teacher Management (which assigns
// teachers to classes) hasn't been built yet, so every class in the
// school is shown for now.
export default function TeacherAttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<AttendanceFormStudent[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.classes ?? []);
        if (data.classes?.length) setClassId(data.classes[0].id);
      });
  }, []);

  useEffect(() => {
    if (!classId || !date) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const [studentsData, attendanceData] = await Promise.all([
        fetch(`/api/students?classId=${classId}`).then((res) => res.json()),
        fetch(`/api/attendance?classId=${classId}&date=${date}`).then((res) => res.json()),
      ]);
      if (ignore) return;

      const existing = new Map(
        (attendanceData.attendance ?? []).map((a: { student_id: string; status: AttendanceStatus }) => [
          a.student_id,
          a.status,
        ]),
      );
      const list: AttendanceFormStudent[] = (studentsData.students ?? []).map(
        (s: { id: string; full_name: string }) => ({
          id: s.id,
          fullName: s.full_name,
          status: (existing.get(s.id) as AttendanceStatus | undefined) ?? "present",
        }),
      );
      setStudents(list);
      setAlreadySubmitted(existing.size > 0);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [classId, date]);

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        date,
        entries: students.map((s) => ({ studentId: s.id, status: s.status })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to submit attendance");
      return;
    }

    setAlreadySubmitted(true);
    setSuccess(
      `Attendance submitted for ${data.submittedCount} students` +
        (data.smsQueuedCount ? ` — ${data.smsQueuedCount} SMS queued` : ""),
    );
  }

  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Mark Attendance</h1>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          />
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-[#3A5A66]">Loading…</p>}
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-3 text-sm text-green-700">{success}</p>}

        {!loading && classes.length === 0 && (
          <p className="text-sm text-[#3A5A66]">No classes yet — ask your admin to create one.</p>
        )}

        {!loading && classId && students.length === 0 && classes.length > 0 && (
          <p className="text-sm text-[#3A5A66]">No students in this class yet.</p>
        )}

        {!loading && students.length > 0 && (
          <>
            {alreadySubmitted && !success && (
              <p className="mb-3 text-sm text-[#FF9932]">
                Attendance for this date has already been submitted.
              </p>
            )}
            <AttendanceForm
              students={students}
              onStatusChange={handleStatusChange}
              onSubmit={handleSubmit}
              disabled={submitting || alreadySubmitted}
              submitLabel={submitting ? "Submitting…" : "Submit Attendance"}
            />
          </>
        )}
      </main>
    </div>
  );
}
