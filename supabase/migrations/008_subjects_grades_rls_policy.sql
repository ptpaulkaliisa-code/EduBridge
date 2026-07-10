-- Same school-scoping pattern used elsewhere. Both tables had RLS
-- enabled (migration 002) but no policy, same gap as classes/attendance.
CREATE POLICY "school_isolation" ON subjects
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "school_isolation" ON grades
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));
