import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface CurrentProfile {
  id: string;
  fullName: string;
  role: UserRole;
  schoolId: string | null;
}

// Looks up the signed-in user's own row (RLS: users_read_own, migration 004).
// Returns null if there's no session or no matching profile.
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, role, school_id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    schoolId: profile.school_id,
  };
}
