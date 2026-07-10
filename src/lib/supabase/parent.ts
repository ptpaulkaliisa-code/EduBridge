import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ParentChild {
  id: string;
  fullName: string;
  classId: string | null;
  className: string | null;
}

// A parent can have multiple children (PRD 5.2) — every parent page
// picks one "current" child (via ?childId=, defaulting to the first)
// and scopes its data to that student.
export async function getParentChildren(parentUserId: string): Promise<ParentChild[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name, class_id, classes(name)")
    .eq("parent_id", parentUserId)
    .eq("is_active", true)
    .order("full_name");

  return (data ?? []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    classId: s.class_id,
    className: (s.classes as unknown as { name: string } | null)?.name ?? null,
  }));
}
