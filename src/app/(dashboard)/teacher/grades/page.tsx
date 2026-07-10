"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherNav } from "@/components/layout/TeacherNav";
import { GradeEntryForm, type GradeEntryRow } from "@/components/grades/GradeEntryForm";
import { CreateSubjectForm } from "@/components/grades/CreateSubjectForm";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

interface ClassOption {
  id: string;
  name: string;
}
interface SubjectOption {
  id: string;
  name: string;
}
interface StudentRow {
  id: string;
  full_name: string;
}
interface GradeRecord {
  student_id: string;
  assessment_name: string;
  score: number;
  max_score: number;
  term: number;
  academic_year: string;
}

// Teacher gradebook (PRD 5.4, Week 5). Subject creation is inline here
// since there's no dedicated Subject Management screen in the PRD, but
// grades can't exist without a subject to attach to.
export default function TeacherGradesPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]);

  const [assessmentName, setAssessmentName] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [term, setTerm] = useState<1 | 2 | 3>(1);
  const [scores, setScores] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    if (!classId) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setSubjectId("");
      const [subjectsData, studentsData] = await Promise.all([
        fetch(`/api/subjects?classId=${classId}`).then((res) => res.json()),
        fetch(`/api/students?classId=${classId}`).then((res) => res.json()),
      ]);
      if (ignore) return;
      setSubjects(subjectsData.subjects ?? []);
      if (subjectsData.subjects?.length) setSubjectId(subjectsData.subjects[0].id);
      setStudents(studentsData.students ?? []);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [classId]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!subjectId) {
        setAllGrades([]);
        return;
      }
      const data = await fetch(`/api/grades?subjectId=${subjectId}`).then((res) => res.json());
      if (!ignore) setAllGrades(data.grades ?? []);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [subjectId]);

  const pastAssessmentNames = useMemo(
    () => [...new Set(allGrades.map((g) => g.assessment_name))],
    [allGrades],
  );

  useEffect(() => {
    function apply() {
      if (!assessmentName) {
        setScores({});
        return;
      }
      const existing = allGrades.filter(
        (g) =>
          g.assessment_name === assessmentName &&
          g.term === term &&
          g.academic_year === CURRENT_ACADEMIC_YEAR,
      );
      if (existing.length > 0) {
        setMaxScore(existing[0].max_score);
        setScores(Object.fromEntries(existing.map((g) => [g.student_id, g.score])));
      }
    }
    apply();
  }, [assessmentName, term, allGrades]);

  const rows: GradeEntryRow[] = students.map((s) => ({
    studentId: s.id,
    fullName: s.full_name,
    score: scores[s.id] ?? null,
  }));

  function handleScoreChange(studentId: string, score: number) {
    setScores((prev) => ({ ...prev, [studentId]: score }));
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    const entries = Object.entries(scores).map(([studentId, score]) => ({ studentId, score }));
    if (!assessmentName.trim()) {
      setError("Enter an assessment name");
      return;
    }
    if (entries.length === 0) {
      setError("Enter at least one score");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        assessmentName,
        maxScore,
        term,
        academicYear: CURRENT_ACADEMIC_YEAR,
        entries,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to save scores");
      return;
    }

    setSuccess(
      `Saved ${data.submittedCount} scores — class average ${data.classAverage.toFixed(1)}` +
        (data.smsQueuedCount ? ` — ${data.smsQueuedCount} SMS queued` : ""),
    );
    setAllGrades((prev) => [
      ...prev.filter(
        (g) => !(g.assessment_name === assessmentName && g.term === term),
      ),
      ...entries.map((e) => ({
        student_id: e.studentId,
        assessment_name: assessmentName,
        score: e.score,
        max_score: maxScore,
        term,
        academic_year: CURRENT_ACADEMIC_YEAR,
      })),
    ]);
  }

  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Gradebook</h1>

        <div className="mb-4 flex flex-wrap gap-2">
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
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a subject
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={term}
            onChange={(e) => setTerm(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          >
            <option value={1}>Term 1</option>
            <option value={2}>Term 2</option>
            <option value={3}>Term 3</option>
          </select>
        </div>

        {classId && (
          <div className="mb-6">
            <CreateSubjectForm
              classId={classId}
              onCreated={(s) => {
                setSubjects((prev) => [...prev, s]);
                setSubjectId(s.id);
              }}
            />
          </div>
        )}

        {loading && <p className="text-sm text-[#3A5A66]">Loading…</p>}

        {!loading && subjectId && (
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              list="assessment-names"
              placeholder="Assessment name, e.g. CAT 1"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="min-w-[220px] rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
            />
            <datalist id="assessment-names">
              {pastAssessmentNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <input
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              className="w-24 rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
              aria-label="Max score"
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-3 text-sm text-green-700">{success}</p>}

        {!loading && subjects.length === 0 && classId && (
          <p className="text-sm text-[#3A5A66]">
            No subjects for this class yet — add one above to start entering grades.
          </p>
        )}

        {!loading && subjectId && students.length > 0 && (
          <GradeEntryForm
            rows={rows}
            maxScore={maxScore}
            onScoreChange={handleScoreChange}
            onSave={handleSave}
            disabled={saving}
            saveLabel={saving ? "Saving…" : "Save Scores"}
          />
        )}
      </main>
    </div>
  );
}
