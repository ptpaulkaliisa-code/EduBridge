import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { CreateClassForm } from "@/components/classes/CreateClassForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";

interface ClassRow {
  id: string;
  name: string;
  level: string | null;
  is_active: boolean;
  students: { count: number }[];
}

// Class management (PRD 5.2, Week 3): list + create classes.
// Teacher assignment isn't shown yet — Teacher Management (also part of
// PRD 5.2) hasn't been built, so there are no teachers to assign.
export default async function AdminClassesPage() {
  const profile = await getCurrentProfile();

  let classes: ClassRow[] = [];
  if (profile?.schoolId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("classes")
      .select("id, name, level, is_active, students(count)")
      .eq("school_id", profile.schoolId)
      .order("name");
    classes = (data as ClassRow[] | null) ?? [];
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Classes</h1>
          <CreateClassForm />
        </div>

        {classes.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No classes yet — create one to get started.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.level ?? "—"}</TableCell>
                  <TableCell>{c.students?.[0]?.count ?? 0}</TableCell>
                  <TableCell>
                    <Badge tone={c.is_active ? "success" : "neutral"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
