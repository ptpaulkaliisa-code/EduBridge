import { AdminNav } from "@/components/layout/AdminNav";
import { Card } from "@/components/ui/Card";

// Admin dashboard home (PRD 5.2, Week 3): summary cards + quick actions.
export default function AdminHomePage() {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">School Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <p className="text-xs text-[#3A5A66]">Total Students</p>
            <p className="text-2xl font-semibold text-[#172B36]">—</p>
          </Card>
          <Card>
            <p className="text-xs text-[#3A5A66]">Total Classes</p>
            <p className="text-2xl font-semibold text-[#172B36]">—</p>
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
      </main>
    </div>
  );
}
