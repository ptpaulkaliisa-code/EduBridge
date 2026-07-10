// Report card PDF generation (Phase 2 — see PRD Section 5.4).
// Will render a per-student PDF with @react-pdf/renderer once grades
// and report-card endpoints ship in Week 5.
export interface ReportCardData {
  studentName: string;
  className: string;
  term: number;
  academicYear: string;
  subjects: { name: string; score: number; maxScore: number; classAverage: number }[];
  classPosition: number | null;
  teacherRemarks: string | null;
}

export async function generateReportCardPDF(data: ReportCardData): Promise<Buffer> {
  void data;
  throw new Error("Report card generation is not implemented yet (Phase 2)");
}
