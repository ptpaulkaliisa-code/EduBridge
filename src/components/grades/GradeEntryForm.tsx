export interface GradeEntryRow {
  studentId: string;
  fullName: string;
  score: number | null;
}

interface GradeEntryFormProps {
  rows: GradeEntryRow[];
  maxScore: number;
  onScoreChange: (studentId: string, score: number) => void;
  onSave: () => void;
}

// Teacher gradebook entry UI (PRD 5.4, Week 5).
export function GradeEntryForm({
  rows,
  maxScore,
  onScoreChange,
  onSave,
}: GradeEntryFormProps) {
  const entered = rows.filter((r) => r.score !== null);
  const average = entered.length
    ? entered.reduce((sum, r) => sum + (r.score ?? 0), 0) / entered.length
    : 0;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.studentId}
          className="flex items-center justify-between rounded-lg border border-[#D9E8E2] px-3 py-2"
        >
          <span className="text-sm text-[#172B36]">{row.fullName}</span>
          <input
            type="number"
            min={0}
            max={maxScore}
            value={row.score ?? ""}
            onChange={(e) => onScoreChange(row.studentId, Number(e.target.value))}
            className="w-20 rounded border border-[#D9E8E2] px-2 py-1 text-sm"
          />
        </div>
      ))}
      <p className="text-xs text-[#3A5A66]">Class average: {average.toFixed(1)}</p>
      <button
        type="button"
        onClick={onSave}
        className="mt-2 rounded-lg bg-[#114C5A] px-4 py-2 text-sm font-medium text-white"
      >
        Save Scores
      </button>
    </div>
  );
}
