import { ParentNav } from "@/components/layout/ParentNav";

// Parent daily reports view (PRD 5.8, Phase 2).
export default function ParentDailyReportsPage() {
  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[#172B36]">Daily Reports</h1>
      </main>
    </div>
  );
}
