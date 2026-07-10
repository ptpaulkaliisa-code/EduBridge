-- Same school-scoping pattern used elsewhere. Both tables had RLS
-- enabled (migration 002) but no policy, same gap as every other
-- table before it.
CREATE POLICY "school_isolation" ON fee_structures
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "school_isolation" ON fee_payments
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));
