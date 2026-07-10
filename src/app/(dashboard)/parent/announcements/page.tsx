import { ParentNav } from "@/components/layout/ParentNav";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";
import { formatDate } from "@/lib/utils/format";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  classes: { name: string } | null;
}

// Parent announcements feed (PRD 5.6, Week 7): school-wide + the
// parent's children's classes, via RLS (migration 011) — not scoped to
// a single "current child" the way attendance/grades/fees are, since
// an announcement can apply to any of a parent's children. No unread
// indicator (would need a read-tracking table that doesn't exist yet).
export default async function ParentAnnouncementsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, classes(name)")
    .order("created_at", { ascending: false });
  const announcements = (data as unknown as AnnouncementRow[] | null) ?? [];

  return (
    <div className="flex min-h-screen">
      <ParentNav />
      <main className="flex-1 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-[#172B36]">Announcements</h1>

        {announcements.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No announcements yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-[#172B36]">📢 {a.title}</p>
                  <span className="text-xs text-[#3A5A66]">
                    {a.classes?.name ?? "Whole school"} · {formatDate(a.created_at)}
                  </span>
                </div>
                <p className="text-sm text-[#3A5A66]">{a.body}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
