-- Parent access, mirroring the parent_child_only pattern migration 002
-- already established for students. Staff already see everything in
-- their school via each table's school_isolation policy; these add a
-- second, narrower policy so a parent can only see rows tied to their
-- own children — Postgres RLS ORs multiple permissive policies
-- together, so staff access is unaffected.
--
-- IMPORTANT: every school_isolation policy grants access whenever
-- users.school_id matches the row's school_id — it has no concept of
-- role. If a parent's users.school_id were set to their child's
-- school (the way staff accounts work), that broad policy alone would
-- let them read every other family's attendance/grades/fees too,
-- making the policies below no-ops. Parent accounts must be created
-- with school_id left NULL — `x = NULL` is never true in SQL, so
-- school_isolation denies them everywhere, and access is granted only
-- through the parent-scoped policies here instead. There is no
-- "create parent" flow yet (Parent Linking, PRD 5.2 screen 5, was
-- deferred back in Week 3) — whoever builds it needs to know this.

CREATE POLICY "parent_child_only" ON attendance
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "parent_child_only" ON grades
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "parent_child_only" ON fee_payments
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "parent_child_only" ON fee_structures
  FOR SELECT USING (
    class_id IS NULL
    OR class_id IN (
      SELECT class_id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "parent_child_only" ON classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "parent_child_only" ON subjects
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- announcements had RLS enabled (migration 002) but no policy at all —
-- nothing has used this table yet. Staff get the usual school-wide
-- policy; parents get school-wide (class_id null) + their child's class.
CREATE POLICY "school_isolation" ON announcements
  FOR ALL USING (school_id = (SELECT school_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "parent_child_only" ON announcements
  FOR SELECT USING (
    class_id IS NULL
    OR class_id IN (
      SELECT class_id FROM students WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );
