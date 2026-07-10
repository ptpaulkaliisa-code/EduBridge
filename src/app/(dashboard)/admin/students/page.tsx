import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { AddStudentForm } from "@/components/students/AddStudentForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";

interface StudentRow {
  id: string;
  full_name: string;
  admission_number: string | null;
  class_id: string | null;
  gender: string | null;
  is_active: boolean;
  classes: { name: string } | null;
}

interface ClassOption {
  id: string;
  name: string;
}

// Student registration & search (PRD 5.2, Week 3).
// Parent linking (PRD 5.2 screen 5) and CSV bulk import (Phase 2) aren't
// built yet — parent_phone is captured directly on the student here as a
// fallback SMS contact, matching the schema.
export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { q, classId } = await searchParams;
  const profile = await getCurrentProfile();

  let students: StudentRow[] = [];
  let classes: ClassOption[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();

    const { data: classData } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", profile.schoolId)
      .eq("is_active", true)
      .order("name");
    classes = classData ?? [];

    let query = supabase
      .from("students")
      .select("id, full_name, admission_number, class_id, gender, is_active, classes(name)")
      .eq("school_id", profile.schoolId)
      .order("full_name");

    if (classId) query = query.eq("class_id", classId);
    if (q) query = query.or(`full_name.ilike.%${q}%,admission_number.ilike.%${q}%`);

    const { data } = await query;
    students = (data as unknown as StudentRow[] | null) ?? [];
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Students</h1>
          <AddStudentForm classes={classes} />
        </div>

        <form method="get" className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search by name or admission number"
            defaultValue={q}
            className="min-w-[240px] rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          />
          <select
            name="classId"
            defaultValue={classId ?? ""}
            className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
          >
            Filter
          </button>
        </form>

        {classes.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">
            Create a class first — students need a class to be registered into.
          </p>
        ) : students.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No students found.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{s.admission_number ?? "—"}</TableCell>
                  <TableCell>{s.classes?.name ?? "—"}</TableCell>
                  <TableCell className="capitalize">{s.gender ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={s.is_active ? "success" : "neutral"}>
                      {s.is_active ? "Active" : "Inactive"}
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
