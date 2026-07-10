import { AdminNav } from "@/components/layout/AdminNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/session";

const TABLES = [
  "schools",
  "users",
  "classes",
  "students",
  "subjects",
  "attendance",
  "grades",
  "fee_structures",
  "fee_payments",
  "announcements",
  "incidents",
  "daily_reports",
  "notification_logs",
] as const;

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AT_API_KEY",
  "AT_USERNAME",
  "AT_SENDER_ID",
  "SEND_SMS_HOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
] as const;

const NOTIFICATION_STATUSES = ["pending", "sent", "failed", "delivered"] as const;

// Platform-level ops page — not in the PRD, built for this project
// specifically. Uses the admin client throughout: table counts and SMS
// queue status are meant to be global (every school), which RLS would
// otherwise scope down to the caller's own school. Restricted to
// super_admin, since this is platform-wide information, not
// school-scoped the way the rest of /admin is.
export default async function AdminSystemPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "super_admin") {
    return (
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="flex-1 p-6">
          <p className="text-sm text-red-600">Super admin access required.</p>
        </main>
      </div>
    );
  }

  const admin = createAdminClient();

  const tableCounts = await Promise.all(
    TABLES.map(async (table) => {
      const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
      return { table, count: error ? null : (count ?? 0), error: error?.message ?? null };
    }),
  );

  const smsStatusCounts = await Promise.all(
    NOTIFICATION_STATUSES.map(async (status) => {
      const { count } = await admin
        .from("notification_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      return { status, count: count ?? 0 };
    }),
  );

  const envChecks = REQUIRED_ENV_VARS.map((key) => ({
    key,
    isSet: Boolean(process.env[key] && process.env[key]!.length > 0),
  }));

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-semibold text-[#172B36]">System Health</h1>

        <h2 className="mb-2 text-sm font-medium text-[#172B36]">Database table counts</h2>
        <div className="mb-6">
          <Table>
            <thead>
              <tr>
                <TableHead>Table</TableHead>
                <TableHead>Rows</TableHead>
              </tr>
            </thead>
            <tbody>
              {tableCounts.map((t) => (
                <tr key={t.table}>
                  <TableCell>{t.table}</TableCell>
                  <TableCell>{t.error ? <span className="text-red-600">error</span> : t.count}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h2 className="mb-2 text-sm font-medium text-[#172B36]">SMS queue status</h2>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {smsStatusCounts.map((s) => (
            <Card key={s.status}>
              <p className="text-xs capitalize text-[#3A5A66]">{s.status}</p>
              <p className="text-2xl font-semibold text-[#172B36]">{s.count}</p>
            </Card>
          ))}
        </div>

        <h2 className="mb-2 text-sm font-medium text-[#172B36]">Environment variables</h2>
        <p className="mb-2 text-xs text-[#3A5A66]">Presence only — values are never shown.</p>
        <Table>
          <thead>
            <tr>
              <TableHead>Variable</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </thead>
          <tbody>
            {envChecks.map((e) => (
              <tr key={e.key}>
                <TableCell>{e.key}</TableCell>
                <TableCell>
                  <Badge tone={e.isSet ? "success" : "danger"}>{e.isSet ? "Set" : "Missing"}</Badge>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </main>
    </div>
  );
}
