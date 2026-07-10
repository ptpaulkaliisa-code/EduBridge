import type { PaymentMethod } from "@/types";

interface PaymentFormValues {
  amountPaid: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
}

interface PaymentFormProps {
  values: PaymentFormValues;
  onChange: (values: PaymentFormValues) => void;
  onSubmit: () => void;
}

// Bursar/admin fee payment recording form (PRD 5.5, Week 6).
export function PaymentForm({ values, onChange, onSubmit }: PaymentFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <input
        type="number"
        placeholder="Amount paid (UGX)"
        value={values.amountPaid || ""}
        onChange={(e) => onChange({ ...values, amountPaid: Number(e.target.value) })}
        className="rounded-lg border border-[#D9E8E2] px-3 py-2 text-sm"
      />
      <select
        value={values.paymentMethod}
        onChange={(e) =>
          onChange({ ...values, paymentMethod: e.target.value as PaymentMethod })
        }
        className="rounded-lg border border-[#D9E8E2] px-3 py-2 text-sm"
      >
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
        <option value="mtn_momo">MTN MoMo</option>
        <option value="airtel_money">Airtel Money</option>
        <option value="other">Other</option>
      </select>
      <input
        type="text"
        placeholder="Reference number"
        value={values.referenceNumber}
        onChange={(e) => onChange({ ...values, referenceNumber: e.target.value })}
        className="rounded-lg border border-[#D9E8E2] px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
      >
        Record Payment
      </button>
    </form>
  );
}
