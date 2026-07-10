-- Grades had no way to prevent duplicate rows for the same
-- student/subject/assessment/term, unlike attendance's
-- UNIQUE(student_id, date). Re-saving an assessment (e.g. fixing a
-- typo) would otherwise pile up new rows instead of updating the
-- existing one. This also lets grade submission use a real upsert.
ALTER TABLE grades
  ADD CONSTRAINT grades_unique_entry
  UNIQUE (student_id, subject_id, assessment_name, term, academic_year);
