-- Same school-scoping pattern used for students/classes. attendance had
-- RLS enabled (migration 002) but no policy, so it default-denied every
-- authenticated query.
CREATE POLICY "school_isolation" ON attendance
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));
