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

export const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  classId: z.string().uuid("Select a class"),
  admissionNumber: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  parentPhone: ugandaPhoneSchema.optional(),
});

export const attendanceEntrySchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().trim().optional(),
});

export const gradeEntrySchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  assessmentName: z.string().trim().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(1).default(100),
  term: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const feePaymentSchema = z.object({
  studentId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paymentDate: z.string(),
  paymentMethod: z.enum(["cash", "bank", "mtn_momo", "airtel_money", "other"]),
  referenceNumber: z.string().trim().optional(),
});
