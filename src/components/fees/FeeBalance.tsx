import { Card } from "@/components/ui/Card";
import { formatUGX } from "@/lib/utils/format";

interface FeeBalanceProps {
  totalDue: number;
  totalPaid: number;
}

// Parent fee balance summary (PRD 5.5).
export function FeeBalance({ totalDue, totalPaid }: FeeBalanceProps) {
  const balance = totalDue - totalPaid;
  return (
    <Card>
      <p className="text-xs text-[#3A5A66]">Balance remaining</p>
      <p className="text-2xl font-semibold text-[#172B36]">{formatUGX(balance)}</p>
      <p className="text-xs text-[#3A5A66]">
        {formatUGX(totalPaid)} paid of {formatUGX(totalDue)}
      </p>
    </Card>
  );
}
