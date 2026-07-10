import { TeacherNav } from "@/components/layout/TeacherNav";

// Teacher dashboard home (PRD 5.3-5.8, Week 4+).
export default function TeacherHomePage() {
  return (
    <div className="flex min-h-screen">
      <TeacherNav />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-[#172B36]">Teacher Dashboard</h1>
      </main>
    </div>
  );
}
