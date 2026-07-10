import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import type { AttendanceStatus } from "@/types";

interface ClassSummary {
  id: string;
  name: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Admin attendance overview (PRD 5.3, Week 4): class-by-class summary
// for a given date. Date-range filtering, per-student attendance rate,
// and CSV export (also listed in PRD 5.3) aren't built in this pass.
export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayISO();
  const profile = await getCurrentProfile();

  let summaries: ClassSummary[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, students(count)")
      .eq("school_id", profile.schoolId)
      .eq("is_active", true)
      .order("name");

    const { data: attendance } = await supabase
      .from("attendance")
      .select("class_id, status")
      .eq("school_id", profile.schoolId)
      .eq("date", date);

    const countsByClass = new Map<string, Record<AttendanceStatus, number>>();
    for (const record of attendance ?? []) {
      const counts = countsByClass.get(record.class_id) ?? {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      counts[record.status as AttendanceStatus]++;
      countsByClass.set(record.class_id, counts);
    }

    summaries = (classes ?? []).map((c) => {
      const counts = countsByClass.get(c.id) ?? { present: 0, absent: 0, late: 0, excused: 0 };
      return {
        id: c.id,
        name: c.name,
        totalStudents: (c.students as { count: number }[] | null)?.[0]?.count ?? 0,
        ...counts,
      };
    });
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Attendance Overview</h1>

        <form method="get" className="mb-4 flex gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
          >
            View
          </button>
        </form>

        {summaries.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No classes yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Class</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Excused</TableHead>
                <TableHead>Not marked</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const marked = s.present + s.absent + s.late + s.excused;
                const notMarked = Math.max(s.totalStudents - marked, 0);
                return (
                  <tr key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.present}</TableCell>
                    <TableCell>{s.absent}</TableCell>
                    <TableCell>{s.late}</TableCell>
                    <TableCell>{s.excused}</TableCell>
                    <TableCell>{notMarked}</TableCell>
                    <TableCell>
                      <Badge tone={marked === 0 ? "neutral" : notMarked > 0 ? "warning" : "success"}>
                        {marked === 0 ? "Not submitted" : notMarked > 0 ? "Partial" : "Complete"}
                      </Badge>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
