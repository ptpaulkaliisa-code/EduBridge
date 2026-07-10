import { Card } from "@/components/ui/Card";

interface AttendanceSummaryProps {
  present: number;
  absent: number;
  late: number;
}

export function AttendanceSummary({ present, absent, late }: AttendanceSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="text-center">
        <p className="text-2xl font-semibold text-[#172B36]">{present}</p>
        <p className="text-xs text-[#3A5A66]">Present</p>
      </Card>
      <Card className="text-center">
        <p className="text-2xl font-semibold text-[#172B36]">{absent}</p>
        <p className="text-xs text-[#3A5A66]">Absent</p>
      </Card>
      <Card className="text-center">
        <p className="text-2xl font-semibold text-[#172B36]">{late}</p>
        <p className="text-xs text-[#3A5A66]">Late</p>
      </Card>
    </div>
  );
}
