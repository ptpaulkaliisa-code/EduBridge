import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { CreateFeeStructureForm } from "@/components/fees/CreateFeeStructureForm";
import { formatUGX, formatDate } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

interface FeeStructureRow {
  id: string;
  name: string;
  amount: number;
  term: number;
  due_date: string | null;
  classes: { name: string } | null;
}

// Fee structure setup (PRD 5.5 screen 1, Week 6).
export default async function AdminFeeStructurePage() {
  const profile = await getCurrentProfile();

  let items: FeeStructureRow[] = [];
  let classes: { id: string; name: string }[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const [{ data: structures }, { data: classData }] = await Promise.all([
      supabase
        .from("fee_structures")
        .select("id, name, amount, term, due_date, classes(name)")
        .eq("school_id", profile.schoolId)
        .eq("academic_year", CURRENT_ACADEMIC_YEAR)
        .order("term"),
      supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", profile.schoolId)
        .eq("is_active", true)
        .order("name"),
    ]);
    items = (structures as unknown as FeeStructureRow[] | null) ?? [];
    classes = classData ?? [];
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Fee Structure</h1>
          <CreateFeeStructureForm classes={classes} />
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No fee items yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Due date</TableHead>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{formatUGX(item.amount)}</TableCell>
                  <TableCell>Term {item.term}</TableCell>
                  <TableCell>{item.classes?.name ?? "All classes"}</TableCell>
                  <TableCell>{item.due_date ? formatDate(item.due_date) : "—"}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
