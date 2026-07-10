import Link from "next/link";
import { ParentNav } from "@/components/layout/ParentNav";
import { Card } from "@/components/ui/Card";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { getParentChildren } from "@/lib/supabase/parent";
import { computeBalances } from "@/lib/fees/balance";
import { formatUGX } from "@/lib/utils/format";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Parent dashboard home (PRD 8.4, Week 7): today's attendance, latest
// grade, fee balance, and the newest announcement for the current child.
export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const { childId: childIdParam } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const children = await getParentChildren(profile.id);
  const currentChild = children.find((c) => c.id === childIdParam) ?? children[0];

  let todayStatus: string | null = null;
  let latestGrade: { subject: string; score: number; maxScore: number } | null = null;
  let balance = 0;
  let latestAnnouncement: { title: string } | null = null;

  if (currentChild) {
    const supabase = await createClient();

    const [{ data: attendanceToday }, { data: grades }, { data: feeStructures }, { data: payments }, { data: announcements }] =
      await Promise.all([
        supabase
          .from("attendance")
          .select("status")
          .eq("student_id", currentChild.id)
          .eq("date", todayISO())
          .maybeSingle(),
        supabase
          .from("grades")
          .select("score, max_score, subjects(name)")
          .eq("student_id", currentChild.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("fee_structures")
          .select("amount, class_id")
          .eq("academic_year", CURRENT_ACADEMIC_YEAR),
        supabase.from("fee_payments").select("student_id, amount_paid").eq("student_id", currentChild.id),
        supabase.from("announcements").select("title").order("created_at", { ascending: false }).limit(1),
      ]);

    todayStatus = attendanceToday?.status ?? null;
    if (grades && grades.length > 0) {
      latestGrade = {
        subject: (grades[0].subjects as unknown as { name: string } | null)?.name ?? "—",
        score: grades[0].score,
        maxScore: grades[0].max_score,
      };
    }
    balance =
      computeBalances(
        [{ id: currentChild.id, class_id: currentChild.classId }],
        feeStructures ?? [],
        payments ?? [],
      ).get(currentChild.id)?.balance ?? 0;
    latestAnnouncement = announcements?.[0] ?? null;
  }

  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">
            {currentChild ? currentChild.fullName : "Welcome"}
          </h1>
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/parent/attendance">
                <Card>
                  <p className="text-xs text-[#3A5A66]">Attendance Today</p>
                  <p className="text-lg font-semibold uppercase text-[#172B36]">
                    {todayStatus ?? "Not marked"}
                  </p>
                </Card>
              </Link>
              <Link href="/parent/grades">
                <Card>
                  <p className="text-xs text-[#3A5A66]">Latest Grade</p>
                  <p className="text-lg font-semibold text-[#172B36]">
                    {latestGrade ? `${latestGrade.score}/${latestGrade.maxScore}` : "—"}
                  </p>
                  <p className="text-xs text-[#3A5A66]">{latestGrade?.subject ?? ""}</p>
                </Card>
              </Link>
            </div>
            <Link href="/parent/fees">
              <Card>
                <p className="text-xs text-[#3A5A66]">Fees</p>
                <p className="text-lg font-semibold text-[#172B36]">
                  {formatUGX(balance)} {balance > 0 ? "DUE" : ""}
                </p>
              </Card>
            </Link>
            {latestAnnouncement && (
              <Link href="/parent/announcements">
                <Card>
                  <p className="text-sm text-[#172B36]">📢 {latestAnnouncement.title}</p>
                </Card>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
