import { z } from "zod";

export const ugandaPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+256|0)7\d{8}$/,
    "Enter a valid Uganda phone number, e.g. 0755269440",
  );

export const otpRequestSchema = z.object({
  phoneNumber: ugandaPhoneSchema,
});

export const otpVerifySchema = z.object({
  phoneNumber: ugandaPhoneSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  level: z.string().trim().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).optional(),
  level: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  classId: z.string().uuid("Select a class"),
  admissionNumber: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  parentPhone: ugandaPhoneSchema.optional(),
});

export const updateStudentSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  classId: z.string().uuid().optional(),
  admissionNumber: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  parentPhone: ugandaPhoneSchema.optional(),
  isActive: z.boolean().optional(),
});

export const attendanceEntrySchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().trim().optional(),
});

export const submitAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  entries: z.array(attendanceEntrySchema).min(1, "No students to submit"),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().trim().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  classId: z.string().uuid(),
});

export const gradeScoreEntrySchema = z.object({
  studentId: z.string().uuid(),
  score: z.number().min(0),
});

export const submitGradesSchema = z.object({
  subjectId: z.string().uuid(),
  assessmentName: z.string().trim().min(1, "Assessment name is required"),
  maxScore: z.number().min(1).default(100),
  term: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  academicYear: z.string().trim().min(1),
  entries: z.array(gradeScoreEntrySchema).min(1, "No scores to submit"),
});

export const updateGradeSchema = z.object({
  score: z.number().min(0).optional(),
  maxScore: z.number().min(1).optional(),
});

export const feePaymentSchema = z.object({
  studentId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paymentDate: z.string(),
  paymentMethod: z.enum(["cash", "bank", "mtn_momo", "airtel_money", "other"]),
  referenceNumber: z.string().trim().optional(),
});
