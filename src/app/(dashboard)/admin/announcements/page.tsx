import { AdminNav } from "@/components/layout/AdminNav";
import { Card } from "@/components/ui/Card";
import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";
import { formatDate } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/session";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  classes: { name: string } | null;
}

// Minimal announcements management (PRD 5.6) — built only so Week 7's
// parent portal has a real list to show. The fuller screen (rich text,
// SMS toggle + cost estimate, scheduling) is Phase 2.
export default async function AdminAnnouncementsPage() {
  const profile = await getCurrentProfile();

  let announcements: AnnouncementRow[] = [];
  let classes: { id: string; name: string }[] = [];

  if (profile?.schoolId) {
    const supabase = await createClient();
    const [{ data: announcementData }, { data: classData }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, body, created_at, classes(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", profile.schoolId)
        .eq("is_active", true)
        .order("name"),
    ]);
    announcements = (announcementData as unknown as AnnouncementRow[] | null) ?? [];
    classes = classData ?? [];
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#172B36]">Announcements</h1>
          <CreateAnnouncementForm classes={classes} />
        </div>

        {announcements.length === 0 ? (
          <p className="text-sm text-[#3A5A66]">No announcements yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-[#172B36]">{a.title}</p>
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
