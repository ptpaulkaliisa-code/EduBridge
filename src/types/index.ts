export type UserRole =
  | "super_admin"
  | "school_admin"
  | "bursar"
  | "teacher"
  | "parent";

export type SchoolType = "primary" | "secondary" | "kindergarten" | "combined";
export type SchoolOwnership = "government" | "private" | "faith_based" | "ngo";
export type SubscriptionTier = "pilot" | "basic" | "standard" | "premium";

export interface School {
  id: string;
  name: string;
  location: string | null;
  district: string | null;
  type: SchoolType | null;
  ownership: SchoolOwnership | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  max_students: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string | null;
  phone_number: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  school_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  level: string | null;
  class_teacher_id: string | null;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export type Gender = "male" | "female" | "other";

export interface Student {
  id: string;
  school_id: string;
  class_id: string | null;
  admission_number: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  parent_id: string | null;
  parent_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  teacher_id: string | null;
  created_at: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  school_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_by: string | null;
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
}

export type Term = 1 | 2 | 3;

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  school_id: string;
  assessment_name: string;
  score: number;
  max_score: number;
  term: Term;
  academic_year: string;
  entered_by: string | null;
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  name: string;
  amount: number;
  currency: string;
  term: Term;
  academic_year: string;
  class_id: string | null;
  due_date: string | null;
  created_at: string;
}

export type PaymentMethod =
  | "cash"
  | "bank"
  | "mtn_momo"
  | "airtel_money"
  | "other";

export interface FeePayment {
  id: string;
  student_id: string;
  school_id: string;
  fee_structure_id: string | null;
  amount_paid: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  school_id: string;
  class_id: string | null;
  title: string;
  body: string;
  created_by: string | null;
  send_sms: boolean;
  sms_sent_at: string | null;
  created_at: string;
}

export type IncidentType = "discipline" | "accident" | "health" | "other";

export interface Incident {
  id: string;
  school_id: string;
  student_id: string;
  reported_by: string | null;
  incident_type: IncidentType | null;
  description: string;
  action_taken: string | null;
  parent_notified: boolean;
  parent_acknowledged: boolean;
  parent_acknowledged_at: string | null;
  created_at: string;
}

export type Mood = "happy" | "sad" | "tired" | "excited" | "sick" | "neutral";

export interface DailyReport {
  id: string;
  student_id: string;
  school_id: string;
  date: string;
  mood: Mood | null;
  meals_eaten: string | null;
  nap_time: string | null;
  activities: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type NotificationType =
  | "attendance"
  | "grade"
  | "fee"
  | "announcement"
  | "incident"
  | "daily_report"
  | "reminder";

export type NotificationStatus = "pending" | "sent" | "failed" | "delivered";

export interface NotificationLog {
  id: string;
  school_id: string | null;
  recipient_phone: string;
  recipient_user_id: string | null;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  at_message_id: string | null;
  cost: number | null;
  sent_at: string | null;
  created_at: string;
}
