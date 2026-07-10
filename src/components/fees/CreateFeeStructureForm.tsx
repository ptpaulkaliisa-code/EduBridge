"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/utils/constants";

interface ClassOption {
  id: string;
  name: string;
}

export function CreateFeeStructureForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState<1 | 2 | 3>(1);
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/fees/structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: Number(amount),
        term,
        academicYear: CURRENT_ACADEMIC_YEAR,
        classId: classId || undefined,
        dueDate: dueDate || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create fee item");
      return;
    }

    setName("");
    setAmount("");
    setDueDate("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add fee item</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-4 text-lg font-semibold text-[#172B36]">Add fee item</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="Name, e.g. Tuition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="Amount (UGX)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <select
            value={term}
            onChange={(e) => setTerm(Number(e.target.value) as 1 | 2 | 3)}
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          >
            <option value={1}>Term 1</option>
            <option value={2}>Term 2</option>
            <option value={3}>Term 3</option>
          </select>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            placeholder="Due date (optional)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !amount}>
              {loading ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
