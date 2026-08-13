-- V5__students_soft_delete_unique_fix.sql
--
-- Bug: deleting a student (StudentService.deleteStudent sets is_deleted =
-- TRUE, it does not remove the row -- see the audit trail / recognition
-- history requirements that depend on the row still existing) and then
-- trying to add the same student again -- manually or via CSV import --
-- fails with a unique-constraint violation.
--
-- Root cause: V1's `uq_students_register_number UNIQUE (register_number)`
-- applies to the register_number column for EVERY row in the table,
-- including soft-deleted ones. StudentService already guards application-
-- level creation with existsByRegisterNumberAndIsDeletedFalse(...), which
-- correctly ignores deleted rows -- but that check passing doesn't help,
-- because the subsequent INSERT still collides with the deleted row's
-- register_number at the database level. The soft-deleted row keeps the
-- register_number value forever, so it can never be reused, even though
-- the student it belonged to no longer "exists" from the application's
-- point of view.
--
-- Fix: MySQL has no native partial/filtered unique index (unlike e.g.
-- Postgres' `UNIQUE ... WHERE`), so this emulates one with a generated
-- column: register_number_active mirrors register_number for active rows
-- (is_deleted = FALSE) and is NULL for soft-deleted rows. The unique index
-- then sits on that generated column instead of on register_number
-- directly. MySQL's UNIQUE index treats NULL as "no value to compare" and
-- allows any number of NULLs, so:
--   * Two active students can never share a register_number (unique index
--     hit, exactly like before).
--   * A soft-deleted student's row contributes NULL to the index, so it no
--     longer blocks that register_number from being reused.
--   * Any number of soft-deleted rows can share the same original
--     register_number (each contributes its own NULL) -- deleting the same
--     student twice, or deleting/re-adding it repeatedly, never conflicts.
--
-- This only changes the uniqueness *scope*; register_number itself is
-- untouched (still NOT NULL, still the only unique student field) and no
-- historical data (recognition_history, activity_logs) is affected, since
-- the student row is never physically deleted.

ALTER TABLE students
    ADD COLUMN register_number_active VARCHAR(30)
        GENERATED ALWAYS AS (CASE WHEN is_deleted = FALSE THEN register_number ELSE NULL END) STORED
        AFTER register_number;

-- Drop the old blanket-unique constraint (implemented as a unique index in
-- MySQL) and replace it with a unique index scoped to active rows only.
ALTER TABLE students DROP INDEX uq_students_register_number;

ALTER TABLE students
    ADD CONSTRAINT uq_students_register_number_active UNIQUE (register_number_active);
