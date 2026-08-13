-- ============================================================================
-- FRHES -- full database setup in one file
-- ============================================================================
-- This is the equivalent of running all five Flyway migrations
-- (V1__baseline_schema.sql, V2__performance_indexes.sql,
-- V3__refresh_tokens.sql, V4__seed_default_settings.sql,
-- V5__students_soft_delete_unique_fix.sql) back to back, plus one sample
-- ADMIN login at the end. Combined here only for convenience
-- (e.g. loading a fresh dev database by hand in one shot) -- the actual
-- Flyway migration files under backend/src/main/resources/db/migration/
-- are still the source of truth the app runs against, and are not replaced
-- by this file.
--
-- NOTE ON FLYWAY: if you run this file against a database and then also
-- start the backend with `docker compose up`, Flyway will try to run its
-- own V1-V4 migrations and will either (a) see the schema already matches
-- and, with baseline-on-migrate, mark it as already-migrated, or (b) error
-- if schema_version bookkeeping is out of sync. For a normal first-time
-- setup, just let Flyway create the schema automatically on backend
-- startup -- use this file instead when you want to seed a database by
-- hand *before* the backend ever starts (e.g. scripting a fresh
-- environment, or restoring a throwaway dev DB), and skip Flyway's own
-- run by not letting the backend auto-migrate against it, or by dropping
-- and recreating the database if Flyway ever complains about a mismatch.
--
-- Login credentials for the sample admin created at the bottom:
--   username: admin
--   password: 12345678
--
-- Usage:
--   mysql -h 127.0.0.1 -P 3307 -u frhes_app -p frhes < frhes_full_setup.sql
-- (this project's docker-compose.yml maps MySQL to host port 3307, not the
-- default 3306 -- adjust host/port/user to match your own .env)
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- Schema (from V1__baseline_schema.sql)
-- ----------------------------------------------------------------------------

CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(20)  NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name             VARCHAR(100)  NOT NULL,
    email                 VARCHAR(150)  NOT NULL,
    username              VARCHAR(50)   NOT NULL,
    password_hash         VARCHAR(255)  NOT NULL,
    phone                 VARCHAR(20)   NULL,
    role_id               BIGINT        NOT NULL,
    status                VARCHAR(20)   NULL,
    avatar_url            VARCHAR(255)  NULL,
    created_by            BIGINT        NULL,
    created_at            DATETIME      NULL,
    updated_at            DATETIME      NULL,
    last_login_at         DATETIME      NULL,
    failed_login_attempts INT           NOT NULL DEFAULT 0,
    locked_until          DATETIME      NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- register_number_active (V5 fix, folded in here) makes the unique
-- constraint apply only among non-deleted students, not to register_number
-- as a whole -- so a deleted student's register number can be reused. See
-- V5__students_soft_delete_unique_fix.sql for the full rationale.
CREATE TABLE students (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    register_number        VARCHAR(30)   NOT NULL,
    register_number_active VARCHAR(30)
        GENERATED ALWAYS AS (CASE WHEN is_deleted = FALSE THEN register_number ELSE NULL END) STORED,
    full_name           VARCHAR(100)  NOT NULL,
    department          VARCHAR(100)  NOT NULL,
    year                INT           NOT NULL,
    hostel_status       VARCHAR(20)   NOT NULL,
    phone               VARCHAR(20)   NULL,
    email               VARCHAR(150)  NULL,
    profile_image_url   VARCHAR(255)  NOT NULL,
    enrollment_status    VARCHAR(20)   NULL,
    registered_by       BIGINT        NOT NULL,
    is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          DATETIME      NULL,
    updated_at          DATETIME      NULL,
    CONSTRAINT uq_students_register_number_active UNIQUE (register_number_active),
    CONSTRAINT fk_students_registered_by FOREIGN KEY (registered_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE face_embeddings (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id       BIGINT        NOT NULL,
    pose             VARCHAR(20)   NOT NULL,
    embedding_vector JSON          NOT NULL,
    model_version    VARCHAR(50)   NOT NULL,
    created_at       DATETIME      NULL,
    CONSTRAINT fk_face_embeddings_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recognition_history (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id               BIGINT         NULL,
    recognized_by_camera     VARCHAR(50)    NOT NULL,
    confidence_score         DECIMAL(5,4)   NOT NULL,
    status                   VARCHAR(20)    NOT NULL,
    recognition_duration_ms  INT            NOT NULL,
    recognized_at            DATETIME       NULL,
    triggered_by             BIGINT         NOT NULL,
    CONSTRAINT fk_recognition_history_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE SET NULL,
    CONSTRAINT fk_recognition_history_triggered_by FOREIGN KEY (triggered_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE system_settings (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key   VARCHAR(100)  NOT NULL,
    setting_value VARCHAR(255)  NOT NULL,
    updated_by    BIGINT        NULL,
    updated_at    DATETIME      NULL,
    CONSTRAINT uq_system_settings_key UNIQUE (setting_key),
    CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE activity_logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT        NOT NULL,
    action      VARCHAR(100)  NOT NULL,
    entity_type VARCHAR(50)   NOT NULL,
    entity_id   BIGINT        NULL,
    details     TEXT          NULL,
    ip_address  VARCHAR(45)   NULL,
    user_agent  VARCHAR(255)  NULL,
    created_at  DATETIME      NULL,
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed roles. Application code looks these up by exact name string
-- ("ADMIN"/"STAFF" in SecurityConfig's hasRole() checks and elsewhere), so
-- these two rows are not optional sample data -- the app cannot function
-- without them.
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full administrative access: user management, settings, analytics, reports'),
    ('STAFF', 'Day-to-day operational access: student enrollment and face recognition');


-- ----------------------------------------------------------------------------
-- Performance indexes (from V2__performance_indexes.sql)
-- ----------------------------------------------------------------------------

-- recognition_history: read constantly by the Recognition History screen
-- (filtered by date range and status) and by the Analytics dashboard's
-- trend/peak-hour/top-camera aggregate queries (grouped by recognized_at and
-- recognized_by_camera).
CREATE INDEX idx_recognition_history_recognized_at ON recognition_history (recognized_at);
CREATE INDEX idx_recognition_history_status ON recognition_history (status);
CREATE INDEX idx_recognition_history_camera ON recognition_history (recognized_by_camera);
CREATE INDEX idx_recognition_history_status_time ON recognition_history (status, recognized_at);

-- activity_logs: the audit log viewer and searchLogs()/filterLogsForReport()
-- queries filter by user, action, and a created_at date range.
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);

-- students: soft-delete filtering (`is_deleted = false`) runs on every
-- single student query in the app, and department is a common report/filter
-- dimension.
CREATE INDEX idx_students_is_deleted ON students (is_deleted);
CREATE INDEX idx_students_department ON students (department);

-- users: admin listing screen filters/sorts by status; login-time lookup
-- benefits from role_id being indexed for the join to roles.
CREATE INDEX idx_users_status ON users (status);


-- ----------------------------------------------------------------------------
-- Refresh tokens table (from V3__refresh_tokens.sql)
-- ----------------------------------------------------------------------------
-- Backs server-side session revocation on logout / password change, instead
-- of a refresh token JWT staying valid until it naturally expires.

CREATE TABLE refresh_tokens (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    token_hash         VARCHAR(64)  NOT NULL,
    expires_at         DATETIME     NOT NULL,
    revoked            BOOLEAN      NOT NULL DEFAULT FALSE,
    revoked_at         DATETIME     NULL,
    created_at         DATETIME     NULL,
    created_ip         VARCHAR(45)  NULL,
    created_user_agent VARCHAR(255) NULL,
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);


-- ----------------------------------------------------------------------------
-- Default system settings (from V4__seed_default_settings.sql)
-- ----------------------------------------------------------------------------
-- Without these seed rows, an admin opening Settings for the first time
-- would have nothing to edit -- updateSetting() can only UPDATE an existing
-- row, it has no "create if missing" path.

INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at) VALUES
    ('RECOGNITION_THRESHOLD', '0.60', NULL, NOW()),
    ('PASSWORD_POLICY', 'MEDIUM', NULL, NOW()),
    ('CAMERA_SOURCES', '["CAM01"]', NULL, NOW()),
    ('JWT_ACCESS_TOKEN_EXPIRY', '900000', NULL, NOW()),
    ('JWT_REFRESH_TOKEN_EXPIRY', '604800000', NULL, NOW());


-- ----------------------------------------------------------------------------
-- Sample admin login
-- ----------------------------------------------------------------------------
-- username: admin
-- password: 12345678
--
-- The hash below is a real BCrypt hash (strength 10, matching Spring
-- Security's default BCryptPasswordEncoder used by this app -- see
-- backend/src/main/java/com/hostel/frs/config/SecurityConfig.java)
-- generated for the plaintext password "12345678" and verified to match.
--
-- Heads-up: PASSWORD_POLICY defaults to MEDIUM (seeded above), which
-- requires at least one letter AND one digit for any password set
-- *through the app* (registration, password change, admin reset). This
-- INSERT bypasses that check since it writes the hash directly -- but if
-- this admin later tries to set their password back to "12345678" via the
-- UI, MEDIUM policy will reject it for having no letters. Fine for a
-- disposable dev login; don't reuse this password anywhere real.

INSERT INTO users (
    full_name, email, username, password_hash, phone,
    role_id, status, created_at, updated_at, failed_login_attempts
)
SELECT
    'Admin User', 'admin@frhes.local', 'admin',
    '$2a$10$v.JcRzKEa4JucIh1y/OphuHXU1kkASgdVhdF1wwXwYma3D71UZzq.',
    NULL, (SELECT id FROM roles WHERE name = 'ADMIN'), 'ACTIVE',
    NOW(), NOW(), 0
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);
