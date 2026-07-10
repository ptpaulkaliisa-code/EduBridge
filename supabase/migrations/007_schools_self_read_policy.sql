-- schools had RLS enabled (migration 002) but no policy, so it
-- default-denied every authenticated query — including the school-name
-- lookup used in SMS message templates, which silently fell back to a
-- generic "Your school" string.
CREATE POLICY "own_school_read" ON schools
  FOR SELECT USING (id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));
