export const UGANDA_DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
  "Masaka",
  "Entebbe",
  "Arua",
] as const;

export const CLASS_LEVELS = {
  kindergarten: ["Baby Class", "Middle Class", "Top Class"],
  primary: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  secondary_o: ["S1", "S2", "S3", "S4"],
  secondary_a: ["S5", "S6"],
} as const;

export const ACADEMIC_TERMS = [
  { term: 1, label: "Term 1", months: "February – May" },
  { term: 2, label: "Term 2", months: "June – August" },
  { term: 3, label: "Term 3", months: "September – December" },
] as const;

export const CURRENT_ACADEMIC_YEAR = "2026";

export function getCurrentTerm(date: Date = new Date()): 1 | 2 | 3 {
  const month = date.getUTCMonth(); // 0-indexed; Jan is bucketed into Term 1
  if (month >= 1 && month <= 4) return 1; // Feb - May
  if (month >= 5 && month <= 7) return 2; // Jun - Aug
  return 3; // Sep - Dec, and Jan
}

export function getTermDateRange(term: 1 | 2 | 3, year: string): { start: string; end: string } {
  const ranges: Record<1 | 2 | 3, [string, string]> = {
    1: [`${year}-02-01`, `${year}-05-31`],
    2: [`${year}-06-01`, `${year}-08-31`],
    3: [`${year}-09-01`, `${year}-12-31`],
  };
  const [start, end] = ranges[term];
  return { start, end };
}

export const SMS_CHARACTER_LIMIT = 160;

export const COLORS = {
  teal: "#114C5A",
  tealDark: "#172B36",
  yellow: "#FFC801",
  orange: "#FF9932",
  mint: "#D9E8E2",
  arctic: "#F1F6F4",
  white: "#FFFFFF",
  textDark: "#172B36",
  textBody: "#3A5A66",
} as const;
