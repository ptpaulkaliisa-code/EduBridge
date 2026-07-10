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

const initialForm = {
  fullName: "",
  classId: "",
  admissionNumber: "",
  dateOfBirth: "",
  gender: "",
  parentPhone: "",
};

export function AddStudentForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        classId: form.classId,
        admissionNumber: form.admissionNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        parentPhone: form.parentPhone || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to add student");
      return;
    }

    setForm(initialForm);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={classes.length === 0}>
        + Add student
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-4 text-lg font-semibold text-[#172B36]">Add student</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
          <select
            value={form.classId}
            onChange={(e) => update("classId", e.target.value)}
            required
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Admission number (optional)"
            value={form.admissionNumber}
            onChange={(e) => update("admissionNumber", e.target.value)}
          />
          <Input
            type="date"
            placeholder="Date of birth"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          >
            <option value="">Gender (optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <Input
            type="tel"
            placeholder="Parent phone, e.g. 0755213838 (optional)"
            value={form.parentPhone}
            onChange={(e) => update("parentPhone", e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.fullName || !form.classId}>
              {loading ? "Adding…" : "Add student"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
