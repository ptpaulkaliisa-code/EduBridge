import { ParentNav } from "@/components/layout/ParentNav";

// Parent incident acknowledgement (PRD 5.7, Phase 2).
export default function ParentIncidentsPage() {
  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-[#172B36]">Incidents</h1>
      </main>
    </div>
  );
}
