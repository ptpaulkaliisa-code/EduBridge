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
