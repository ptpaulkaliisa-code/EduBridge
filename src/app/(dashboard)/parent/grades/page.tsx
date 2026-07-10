import { ParentNav } from "@/components/layout/ParentNav";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { GradeCard } from "@/components/grades/GradeCard";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { getCurrentProfile } from "@/lib/supabase/session";
import { getParentChildren } from "@/lib/supabase/parent";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface GradeRow {
  subject_id: string;
  subjectName: string;
  assessment_name: string;
  score: number;
  max_score: number;
  term: number;
  academic_year: string;
  created_at: string;
}

// Parent grades view (PRD 5.4, Week 7): a card per subject with the
// latest score + class average, expandable to the full history.
export default async function ParentGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const { childId: childIdParam } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const children = await getParentChildren(profile.id);
  const currentChild = children.find((c) => c.id === childIdParam) ?? children[0];

  let bySubject = new Map<string, GradeRow[]>();
  const classAverages = new Map<string, number>();

  if (currentChild) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("grades")
      .select("subject_id, assessment_name, score, max_score, term, academic_year, created_at, subjects(name)")
      .eq("student_id", currentChild.id)
      .order("created_at", { ascending: false });

    const rows: GradeRow[] = (data ?? []).map((g) => ({
      subject_id: g.subject_id,
      subjectName: (g.subjects as unknown as { name: string } | null)?.name ?? "—",
      assessment_name: g.assessment_name,
      score: g.score,
      max_score: g.max_score,
      term: g.term,
      academic_year: g.academic_year,
      created_at: g.created_at,
    }));

    bySubject = new Map();
    for (const row of rows) {
      const list = bySubject.get(row.subject_id) ?? [];
      list.push(row);
      bySubject.set(row.subject_id, list);
    }

    // Uses the admin client deliberately: RLS correctly stops a parent
    // from reading other students' individual grade rows, but a true
    // class average needs every student's score for the assessment.
    // Only the aggregated number below is ever sent to the page — the
    // per-student rows this query returns never get rendered.
    const admin = createAdminClient();
    for (const [subjectId, rows] of bySubject) {
      const latest = rows[0];
      const { data: classScores } = await admin
        .from("grades")
        .select("score")
        .eq("subject_id", subjectId)
        .eq("assessment_name", latest.assessment_name)
        .eq("term", latest.term)
        .eq("academic_year", latest.academic_year);
      const scores = (classScores ?? []).map((s) => s.score);
      const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : latest.score;
      classAverages.set(subjectId, average);
    }
  }

  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Grades</h1>
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
        ) : bySubject.size === 0 ? (
          <p className="text-sm text-[#3A5A66]">No grades recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...bySubject.entries()].map(([subjectId, rows]) => {
              const latest = rows[0];
              return (
                <details key={subjectId} className="rounded-xl border border-[#D9E8E2] bg-white">
                  <summary className="cursor-pointer list-none p-1">
                    <GradeCard
                      subject={latest.subjectName}
                      score={latest.score}
                      maxScore={latest.max_score}
                      classAverage={Math.round((classAverages.get(subjectId) ?? 0) * 10) / 10}
                    />
                  </summary>
                  <div className="border-t border-[#D9E8E2] p-3">
                    <Table>
                      <thead>
                        <tr>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Score</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <TableCell>{r.assessment_name}</TableCell>
                            <TableCell>Term {r.term}</TableCell>
                            <TableCell>
                              {r.score}/{r.max_score}
                            </TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
