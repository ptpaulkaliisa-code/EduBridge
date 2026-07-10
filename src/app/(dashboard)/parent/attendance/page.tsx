import { ParentNav } from "@/components/layout/ParentNav";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { AttendanceSummary } from "@/components/attendance/AttendanceSummary";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { getCurrentProfile } from "@/lib/supabase/session";
import { getParentChildren } from "@/lib/supabase/parent";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import { CURRENT_ACADEMIC_YEAR, getCurrentTerm, getTermDateRange } from "@/lib/utils/constants";
import type { AttendanceStatus } from "@/types";

function currentMonthDays(): string[] {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: lastDay }, (_, i) =>
    new Date(Date.UTC(year, month, i + 1)).toISOString().slice(0, 10),
  );
}

// Parent attendance calendar (PRD 5.3, Week 7): current month
// colour-coded, current-term present/absent/late summary, day-by-day
// list.
export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const { childId: childIdParam } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const children = await getParentChildren(profile.id);
  const currentChild = children.find((c) => c.id === childIdParam) ?? children[0];

  let records: { date: string; status: AttendanceStatus }[] = [];
  const term = getCurrentTerm();
  const { start, end } = getTermDateRange(term, CURRENT_ACADEMIC_YEAR);

  if (currentChild) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("attendance")
      .select("date, status")
      .eq("student_id", currentChild.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });
    records = data ?? [];
  }

  const byDate = new Map(records.map((r) => [r.date, r.status]));
  const calendarDays = currentMonthDays().map((date) => ({
    date,
    status: byDate.get(date) ?? null,
  }));

  const summary = {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
  };

  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Attendance</h1>
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
        ) : (
          <>
            <p className="mb-2 text-sm text-[#3A5A66]">Term {term} summary</p>
            <div className="mb-6">
              <AttendanceSummary {...summary} />
            </div>

            <p className="mb-2 text-sm text-[#3A5A66]">This month</p>
            <div className="mb-6">
              <AttendanceCalendar days={calendarDays} />
            </div>

            <p className="mb-2 text-sm text-[#3A5A66]">History</p>
            {records.length === 0 ? (
              <p className="text-sm text-[#3A5A66]">No attendance recorded this term yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.date}>
                      <TableCell>{formatDate(r.date)}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </main>
    </div>
  );
}
