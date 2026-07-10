"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatUGX } from "@/lib/utils/format";

interface ClassOption {
  id: string;
  name: string;
  studentCount: number;
}

// PRD 3.3: Africa's Talking SMS costs ~UGX 30-50 per message delivered.
const SMS_COST_LOW = 30;
const SMS_COST_HIGH = 50;

export function CreateAnnouncementForm({
  classes,
  totalStudentCount,
}: {
  classes: ClassOption[];
  totalStudentCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [classId, setClassId] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recipientCount = classId
    ? classes.find((c) => c.id === classId)?.studentCount ?? 0
    : totalStudentCount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, classId: classId || undefined, sendSms }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to post announcement");
      return;
    }

    setTitle("");
    setBody("");
    setSendSms(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New announcement</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-4 text-lg font-semibold text-[#172B36]">New announcement</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          />
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          >
            <option value="">Whole school ({totalStudentCount} students)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} students)
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-[#172B36]">
            <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
            Also send as SMS
          </label>
          {sendSms && (
            <p className="text-xs text-[#3A5A66]">
              Up to {recipientCount} SMS (one per student with a parent phone on file) — estimated{" "}
              {formatUGX(recipientCount * SMS_COST_LOW)}–{formatUGX(recipientCount * SMS_COST_HIGH)}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !body}>
              {loading ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
