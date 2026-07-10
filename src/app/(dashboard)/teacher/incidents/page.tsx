import { TeacherNav } from "@/components/layout/TeacherNav";

// Teacher incident filing (PRD 5.7, Phase 2).
export default function TeacherIncidentsPage() {
  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[#172B36]">File Incident</h1>
      </main>
    </div>
  );
}
