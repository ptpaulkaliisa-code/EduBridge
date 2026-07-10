import Link from "next/link";
import { AdminNav } from "@/components/layout/AdminNav";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";

// Admin dashboard home (PRD 5.2, Week 3): summary cards + quick actions.
export default async function AdminHomePage() {
  const profile = await getCurrentProfile();

  let studentCount: number | null = null;
  let classCount: number | null = null;

  if (profile?.schoolId) {
    const supabase = await createClient();
    const [{ count: students }, { count: classes }] = await Promise.all([
      supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", profile.schoolId)
        .eq("is_active", true),
      supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("school_id", profile.schoolId)
        .eq("is_active", true),
    ]);
    studentCount = students ?? 0;
    classCount = classes ?? 0;
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">School Dashboard</h1>

        {!profile?.schoolId && (
          <p className="mb-4 text-sm text-red-600">
            Your account has no school assigned — numbers below will stay empty until one is set.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <p className="text-xs text-[#3A5A66]">Total Students</p>
            <p className="text-2xl font-semibold text-[#172B36]">{studentCount ?? "—"}</p>
          </Card>
          <Card>
            <p className="text-xs text-[#3A5A66]">Total Classes</p>
            <p className="text-2xl font-semibold text-[#172B36]">{classCount ?? "—"}</p>
          </Card>
          <Card>
            <p className="text-xs text-[#3A5A66]">Attendance Today</p>
            <p className="text-2xl font-semibold text-[#172B36]">—</p>
          </Card>
          <Card>
            <p className="text-xs text-[#3A5A66]">Outstanding Fees</p>
            <p className="text-2xl font-semibold text-[#172B36]">—</p>
          </Card>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/admin/students"
            className="rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
          >
            Add student
          </Link>
          <Link
            href="/admin/classes"
            className="rounded-lg border border-[#114C5A] px-4 py-2 text-sm font-medium text-[#114C5A]"
          >
            Add class
          </Link>
        </div>
      </main>
    </div>
  );
}
