-- Parent Linking (PRD 5.2). Until now, adding a student saved the
-- parent's phone on the student only: no parent login was created and
-- students.parent_id stayed NULL, so no parent could log in. The API
-- now links on create/update (src/lib/parents/link.ts); this backfills
-- students entered before that.
--
-- school_id stays NULL on parent accounts. See migration 011: a parent
-- with a school_id would match every school_isolation policy and see
-- every family's records.
--
-- Numbers that already belong to a staff account are skipped (one role
-- per phone); those students keep parent_phone for SMS but get no
-- parent login. No welcome SMS is queued for backfilled parents.

INSERT INTO users (phone_number, full_name, role, school_id)
SELECT s.parent_phone, 'Parent of ' || MIN(s.full_name), 'parent', NULL
FROM students s
WHERE s.parent_phone IS NOT NULL
  AND s.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.phone_number = s.parent_phone)
GROUP BY s.parent_phone;

UPDATE students s
SET parent_id = u.id
FROM users u
WHERE s.parent_id IS NULL
  AND s.parent_phone = u.phone_number
  AND u.role = 'parent';
