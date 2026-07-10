-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- SCHOOLS
-- ─────────────────────────────────────────────
CREATE TABLE schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  location         VARCHAR(255),
  district         VARCHAR(100),
  type             VARCHAR(50) CHECK (type IN ('primary', 'secondary', 'kindergarten', 'combined')),
  ownership        VARCHAR(50) CHECK (ownership IN ('government', 'private', 'faith_based', 'ngo')),
  subscription_tier VARCHAR(50) DEFAULT 'pilot' CHECK (subscription_tier IN ('pilot', 'basic', 'standard', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  max_students     INTEGER DEFAULT 500,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id      UUID UNIQUE,            -- links to Supabase Auth
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email        VARCHAR(255),
  full_name    VARCHAR(255) NOT NULL,
  role         VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'bursar', 'teacher', 'parent')),
  school_id    UUID REFERENCES schools(id) ON DELETE CASCADE,
  is_active    BOOLEAN DEFAULT true,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_phone ON users(phone_number);

-- ─────────────────────────────────────────────
-- CLASSES
-- ─────────────────────────────────────────────
CREATE TABLE classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name             VARCHAR(100) NOT NULL,    -- e.g. "P6A", "S3 Blue", "Baby Class"
  level            VARCHAR(50),              -- "P1"–"P7", "S1"–"S6", "Kindergarten"
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  academic_year    VARCHAR(10) NOT NULL DEFAULT '2026',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_school ON classes(school_id);

-- ─────────────────────────────────────────────
-- STUDENTS
-- ─────────────────────────────────────────────
CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id         UUID REFERENCES classes(id) ON DELETE SET NULL,
  admission_number VARCHAR(50),
  full_name        VARCHAR(255) NOT NULL,
  date_of_birth    DATE,
  gender           VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  parent_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_phone     VARCHAR(20),             -- fallback SMS if parent not registered
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_id);

-- ─────────────────────────────────────────────
-- SUBJECTS
-- ─────────────────────────────────────────────
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name        VARCHAR(100) NOT NULL,   -- "Mathematics", "English", "Science"
  teacher_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subjects_class ON subjects(class_id);

-- ─────────────────────────────────────────────
-- ATTENDANCE
-- ─────────────────────────────────────────────
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes       TEXT,
  marked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  sms_sent    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);

-- ─────────────────────────────────────────────
-- GRADES / SCORES
-- ─────────────────────────────────────────────
CREATE TABLE grades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id       UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  school_id        UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  assessment_name  VARCHAR(100) NOT NULL,   -- "CAT 1", "Mid-Term Exam", "End of Term"
  score            DECIMAL(5,2) NOT NULL,
  max_score        DECIMAL(5,2) NOT NULL DEFAULT 100,
  term             INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  academic_year    VARCHAR(10) NOT NULL,
  entered_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  sms_sent         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);

-- ─────────────────────────────────────────────
-- FEE STRUCTURES
-- ─────────────────────────────────────────────
CREATE TABLE fee_structures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name          VARCHAR(100) NOT NULL,   -- "Tuition", "Development Fund", "PTA Levy"
  amount        DECIMAL(12,2) NOT NULL,
  currency      VARCHAR(5) DEFAULT 'UGX',
  term          INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  academic_year VARCHAR(10) NOT NULL,
  class_id      UUID REFERENCES classes(id) ON DELETE CASCADE,  -- NULL = applies to all classes
  due_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fee_structures_school ON fee_structures(school_id);

-- ─────────────────────────────────────────────
-- FEE PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE fee_payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  school_id          UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  fee_structure_id   UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
  amount_paid        DECIMAL(12,2) NOT NULL,
  currency           VARCHAR(5) DEFAULT 'UGX',
  payment_date       DATE NOT NULL,
  payment_method     VARCHAR(50) CHECK (payment_method IN ('cash', 'bank', 'mtn_momo', 'airtel_money', 'other')),
  reference_number   VARCHAR(100),
  recorded_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON fee_payments(student_id);
CREATE INDEX idx_payments_school ON fee_payments(school_id);

-- ─────────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────────
CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,  -- NULL = school-wide
  title        VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  send_sms     BOOLEAN DEFAULT false,
  sms_sent_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_school ON announcements(school_id);

-- ─────────────────────────────────────────────
-- INCIDENTS
-- ─────────────────────────────────────────────
CREATE TABLE incidents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id                UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_id               UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  reported_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  incident_type            VARCHAR(50) CHECK (incident_type IN ('discipline', 'accident', 'health', 'other')),
  description              TEXT NOT NULL,
  action_taken             TEXT,
  parent_notified          BOOLEAN DEFAULT false,
  parent_acknowledged      BOOLEAN DEFAULT false,
  parent_acknowledged_at   TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_student ON incidents(student_id);

-- ─────────────────────────────────────────────
-- DAILY REPORTS (Kindergarten)
-- ─────────────────────────────────────────────
CREATE TABLE daily_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  mood        VARCHAR(50) CHECK (mood IN ('happy', 'sad', 'tired', 'excited', 'sick', 'neutral')),
  meals_eaten TEXT,
  nap_time    VARCHAR(100),
  activities  TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ─────────────────────────────────────────────
-- NOTIFICATION LOGS
-- ─────────────────────────────────────────────
CREATE TABLE notification_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  recipient_phone   VARCHAR(20) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type              VARCHAR(50) NOT NULL CHECK (type IN ('attendance', 'grade', 'fee', 'announcement', 'incident', 'daily_report', 'reminder')),
  message           TEXT NOT NULL,
  status            VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  at_message_id     VARCHAR(100),    -- Africa's Talking message ID
  cost              DECIMAL(8,4),    -- SMS cost in USD
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_school ON notification_logs(school_id);
CREATE INDEX idx_notifications_status ON notification_logs(status);
