import type { AttendanceStatus } from "@/types";

export interface AttendanceFormStudent {
  id: string;
  fullName: string;
  status: AttendanceStatus | null;
}

interface AttendanceFormProps {
  students: AttendanceFormStudent[];
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onSubmit: () => void;
}

// Teacher attendance marking UI (PRD 5.3, Week 4). Wired up once the
// /api/attendance route and Supabase queries land.
export function AttendanceForm({
  students,
  onStatusChange,
  onSubmit,
}: AttendanceFormProps) {
  return (
    <div className="flex flex-col gap-2">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center justify-between rounded-lg border border-[#D9E8E2] px-3 py-2"
        >
          <span className="text-sm text-[#172B36]">{student.fullName}</span>
          <div className="flex gap-1">
            {(["present", "absent", "late", "excused"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(student.id, status)}
                className={
                  student.status === status
                    ? "rounded px-2 py-1 text-xs bg-[#114C5A] text-white"
                    : "rounded px-2 py-1 text-xs bg-[#F1F6F4] text-[#3A5A66]"
                }
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onSubmit}
        className="mt-2 rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
      >
        Submit Attendance
      </button>
    </div>
  );
}
