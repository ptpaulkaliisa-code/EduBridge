"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ClassOption {
  id: string;
  name: string;
}

export function CreateAnnouncementForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, classId: classId || undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to post announcement");
      return;
    }

    setTitle("");
    setBody("");
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
            <option value="">Whole school</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
