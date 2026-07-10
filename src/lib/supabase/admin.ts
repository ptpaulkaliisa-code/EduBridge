import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only privileged operations (bypasses RLS).
// Used for pre-auth phone lookups and auth_id linking, where the caller
// doesn't have a Supabase session yet. Never import this into client code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
