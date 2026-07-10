-- Same school-scoping pattern used for students (migration 002).
-- Without this, classes had RLS enabled but no policy, so every
-- authenticated query against it default-denied.
CREATE POLICY "school_isolation" ON classes
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));
