import type { AttendanceStatus } from "@/types";

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  late: "bg-[#FFC801]",
  excused: "bg-[#3A5A66]",
};

interface AttendanceCalendarProps {
  days: { date: string; status: AttendanceStatus | null }[];
}

// Parent attendance calendar view (PRD 5.3).
export function AttendanceCalendar({ days }: AttendanceCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => (
        <div
          key={day.date}
          title={day.date}
          className={`h-6 w-6 rounded ${day.status ? STATUS_COLOR[day.status] : "bg-[#F1F6F4]"}`}
        />
      ))}
    </div>
  );
}
