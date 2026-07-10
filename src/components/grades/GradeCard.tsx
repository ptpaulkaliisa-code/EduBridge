import { Card } from "@/components/ui/Card";

interface GradeCardProps {
  subject: string;
  score: number;
  maxScore: number;
  classAverage: number;
}

// Parent grades view — subject card (PRD 5.4).
export function GradeCard({ subject, score, maxScore, classAverage }: GradeCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-[#172B36]">{subject}</p>
      <p className="text-xl font-semibold text-[#114C5A]">
        {score}/{maxScore}
      </p>
      <p className="text-xs text-[#3A5A66]">Class average: {classAverage}</p>
    </Card>
  );
}
