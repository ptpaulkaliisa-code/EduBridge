import { ParentNav } from "@/components/layout/ParentNav";
import { Card } from "@/components/ui/Card";

// Parent dashboard home (PRD 8.4, Week 7).
export default function ParentHomePage() {
  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">
          Welcome back
        </h1>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs text-[#3A5A66]">Attendance</p>
            <p className="text-lg font-semibold text-[#172B36]">—</p>
          </Card>
          <Card>
            <p className="text-xs text-[#3A5A66]">Latest Grade</p>
            <p className="text-lg font-semibold text-[#172B36]">—</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
