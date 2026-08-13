-- V2__performance_indexes.sql
--
-- Every index below targets a column that's actually filtered or sorted on
-- by an existing query, cross-referenced against RecognitionHistoryRepository,
-- ActivityLogRepository, and StudentRepository at the time this was written --
-- this is not a "add indexes to everything" pass, since every extra index has
-- a real write-amplification cost on every INSERT/UPDATE to that table.

-- recognition_history: read constantly by the Recognition History screen
-- (filtered by date range and status) and by the Analytics dashboard's
-- trend/peak-hour/top-camera aggregate queries (grouped by recognized_at and
-- recognized_by_camera). Without these, every one of those queries was a
-- full table scan that only gets worse as the log grows.
CREATE INDEX idx_recognition_history_recognized_at ON recognition_history (recognized_at);
CREATE INDEX idx_recognition_history_status ON recognition_history (status);
CREATE INDEX idx_recognition_history_camera ON recognition_history (recognized_by_camera);
-- Composite index for the common "status + time range" query shape (e.g.
-- "show me all MATCHED entries in the last 7 days") -- a composite index
-- lets MySQL satisfy both the equality filter and the range filter from one
-- index instead of combining two single-column indexes at query time.
CREATE INDEX idx_recognition_history_status_time ON recognition_history (status, recognized_at);

-- activity_logs: the audit log viewer and searchLogs()/filterLogsForReport()
-- queries filter by user, action, and a created_at date range.
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);

-- students: soft-delete filtering (`is_deleted = false`) runs on every
-- single student query in the app (search, get-by-id, recognition lookups),
-- and department is a common report/filter dimension.
CREATE INDEX idx_students_is_deleted ON students (is_deleted);
CREATE INDEX idx_students_department ON students (department);

-- users: UserService's admin listing screen filters/sorts by status, and
-- CustomUserDetailsService's login-time lookup benefits from role_id being
-- indexed for the join to roles (MySQL does index FK columns by default in
-- InnoDB when a FK constraint exists, but this is made explicit rather than
-- relying on that implicit behavior).
CREATE INDEX idx_users_status ON users (status);
