import { TeacherNav } from "@/components/layout/TeacherNav";

// Teacher class announcements (PRD 5.6, Phase 2).
export default function TeacherAnnouncementsPage() {
  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[#172B36]">Announcements</h1>
      </main>
    </div>
  );
}
