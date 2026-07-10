import { TeacherNav } from "@/components/layout/TeacherNav";

// Kindergarten daily reports (PRD 5.8, Phase 2).
export default function TeacherDailyReportsPage() {
  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[#172B36]">Daily Reports</h1>
      </main>
    </div>
  );
}
