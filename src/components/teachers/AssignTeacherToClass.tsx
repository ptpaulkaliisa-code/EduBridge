"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ClassOption {
  id: string;
  name: string;
}

export function AssignTeacherToClass({
  teacherId,
  classes,
}: {
  teacherId: string;
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!classId) return;
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classTeacherId: teacherId }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to assign class");
      return;
    }

    setClassId("");
    router.refresh();
  }

  if (classes.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="rounded border border-[#D9E8E2] px-2 py-1 text-xs"
      >
        <option value="">Assign to class…</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        onClick={handleAssign}
        disabled={!classId || loading}
        className="px-2 py-1 text-xs"
      >
        {loading ? "…" : "Assign"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
