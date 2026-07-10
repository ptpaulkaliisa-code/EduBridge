-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see data from their own school
CREATE POLICY "school_isolation" ON students
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));

-- Parents can only see their own children
CREATE POLICY "parent_child_only" ON students
  FOR SELECT USING (
    parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid())
  );
