import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

interface SummaryRow {
  key: string;
  className: string;
  subjectName: string;
  assessmentName: string;
  average: number;
  belowThreshold: number;
  total: number;
}

const BELOW_THRESHOLD_PERCENT = 50;

// Admin grades overview (PRD 5.4, Week 5): per-class, per-subject
// summary + a below-50% flag count. The 50% threshold isn't
// configurable yet (PRD calls it out as "customisable"), and PDF
// report card generation is Phase 2 per the PRD's own build phases.
export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>;
}) {
  const { term: termParam } = await searchParams;
  const term = Number(termParam ?? "1");
  const profile = await getCurrentProfile();

  let rows: SummaryRow[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, class_id, classes(name)")
      .eq("school_id", profile.schoolId);
    const subjectById = new Map(
      (subjects ?? []).map((s) => [
        s.id,
        { name: s.name, className: (s.classes as unknown as { name: string } | null)?.name ?? "—" },
      ]),
    );

    const { data: grades } = await supabase
      .from("grades")
      .select("subject_id, assessment_name, score, max_score")
      .eq("school_id", profile.schoolId)
      .eq("term", term)
      .eq("academic_year", CURRENT_ACADEMIC_YEAR);

    interface GradeGroup {
      subjectId: string;
      assessmentName: string;
      scores: number[];
    }

    const groups = new Map<string, GradeGroup>();
    for (const g of grades ?? []) {
      const key = `${g.subject_id}::${g.assessment_name}`;
      const group: GradeGroup = groups.get(key) ?? {
        subjectId: g.subject_id,
        assessmentName: g.assessment_name,
        scores: [],
      };
      group.scores.push((g.score / g.max_score) * 100);
      groups.set(key, group);
    }

    rows = [...groups.entries()].map(([key, group]) => {
      const subject = subjectById.get(group.subjectId);
      const average = group.scores.reduce((sum, s) => sum + s, 0) / group.scores.length;
      const belowThreshold = group.scores.filter((s) => s < BELOW_THRESHOLD_PERCENT).length;
      return {
        key,
        className: subject?.className ?? "—",
        subjectName: subject?.name ?? "—",
        assessmentName: group.assessmentName,
        average,
        belowThreshold,
        total: group.scores.length,
      };
    });
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Grades Overview</h1>

        <form method="get" className="mb-4 flex gap-2">
          <select
            name="term"
            defaultValue={String(term)}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          >
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
          >
            View
          </button>
        </form>

        {rows.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No grades entered for this term yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Class average</TableHead>
                <TableHead>Below {BELOW_THRESHOLD_PERCENT}%</TableHead>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <TableCell>{r.className}</TableCell>
                  <TableCell>{r.subjectName}</TableCell>
                  <TableCell>{r.assessmentName}</TableCell>
                  <TableCell>{r.average.toFixed(1)}%</TableCell>
                  <TableCell>
                    {r.belowThreshold > 0 ? (
                      <Badge tone="warning">
                        {r.belowThreshold} of {r.total}
                      </Badge>
                    ) : (
                      <Badge tone="success">0</Badge>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
