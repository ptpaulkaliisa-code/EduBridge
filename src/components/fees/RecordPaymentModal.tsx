"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FeeBalance } from "@/components/fees/FeeBalance";
import { PaymentForm } from "@/components/fees/PaymentForm";
import type { PaymentMethod } from "@/types";

interface RecordPaymentModalProps {
  studentId: string;
  studentName: string;
  totalDue: number;
  totalPaid: number;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentModal({
  studentId,
  studentName,
  totalDue,
  totalPaid,
}: RecordPaymentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    amountPaid: 0,
    paymentMethod: "cash" as PaymentMethod,
    referenceNumber: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!values.amountPaid) {
      setError("Enter an amount");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/fees/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        amountPaid: values.amountPaid,
        paymentDate: todayISO(),
        paymentMethod: values.paymentMethod,
        referenceNumber: values.referenceNumber || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to record payment");
      return;
    }

    setValues({ amountPaid: 0, paymentMethod: "cash", referenceNumber: "" });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Record payment</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-1 text-lg font-semibold text-[#172B36]">Record payment</h2>
        <p className="mb-4 text-sm text-[#3A5A66]">{studentName}</p>
        <div className="mb-4">
          <FeeBalance totalDue={totalDue} totalPaid={totalPaid} />
        </div>
        <PaymentForm values={values} onChange={setValues} onSubmit={handleSubmit} />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-2 text-sm text-[#3A5A66]">Saving…</p>}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 text-xs text-[#3A5A66] underline"
        >
          Cancel
        </button>
      </Modal>
    </>
  );
}
