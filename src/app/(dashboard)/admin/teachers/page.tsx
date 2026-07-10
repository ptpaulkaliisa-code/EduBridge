import { AdminNav } from "@/components/layout/AdminNav";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { CreateTeacherForm } from "@/components/teachers/CreateTeacherForm";
import { AssignTeacherToClass } from "@/components/teachers/AssignTeacherToClass";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/session";

interface TeacherRow {
  id: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
}

// Teacher management (PRD 5.2, Week 8): add teachers (queues an SMS
// invite — actual delivery still depends on Africa's Talking, same as
// every other SMS in this project) and assign them to classes.
// Subject-level assignment (also mentioned in PRD 5.2) isn't built —
// only class assignment was asked for.
export default async function AdminTeachersPage() {
  const profile = await getCurrentProfile();

  let teachers: TeacherRow[] = [];
  let classesByTeacher = new Map<string, { id: string; name: string }[]>();
  let allClasses: { id: string; name: string }[] = [];

  if (profile?.schoolId) {
    const admin = createAdminClient();
    const supabase = await createClient();

    const [{ data: teacherData }, { data: classData }] = await Promise.all([
      admin
        .from("users")
        .select("id, full_name, phone_number, is_active")
        .eq("school_id", profile.schoolId)
        .eq("role", "teacher")
        .order("full_name"),
      supabase
        .from("classes")
        .select("id, name, class_teacher_id")
        .eq("school_id", profile.schoolId)
        .eq("is_active", true)
        .order("name"),
    ]);

    teachers = teacherData ?? [];
    allClasses = (classData ?? []).map((c) => ({ id: c.id, name: c.name }));

    classesByTeacher = new Map();
    for (const c of classData ?? []) {
      if (!c.class_teacher_id) continue;
      const list = classesByTeacher.get(c.class_teacher_id) ?? [];
      list.push({ id: c.id, name: c.name });
      classesByTeacher.set(c.class_teacher_id, list);
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Teachers</h1>
          <CreateTeacherForm />
        </div>

        {teachers.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No teachers yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const assigned = classesByTeacher.get(t.id) ?? [];
                return (
                  <tr key={t.id}>
                    <TableCell>{t.full_name}</TableCell>
                    <TableCell>{t.phone_number}</TableCell>
                    <TableCell>
                      {assigned.length === 0 ? "—" : assigned.map((c) => c.name).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge tone={t.is_active ? "success" : "neutral"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AssignTeacherToClass teacherId={t.id} classes={allClasses} />
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </main>
    </div>
  );
}
