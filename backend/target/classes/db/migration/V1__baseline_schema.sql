-- V1__baseline_schema.sql
--
-- Baseline schema for a fresh database, replacing Hibernate's `ddl-auto:update`.
-- Every column here corresponds 1:1 to an existing @Entity's @Column mapping
-- at the time this migration was written (see the audit report for the
-- full entity-by-entity review this was derived from).
--
-- IMPORTANT for an existing database that was created by ddl-auto:update:
-- Flyway's `baseline-on-migrate: true` (see application.yml) means Flyway
-- will mark whatever schema already exists as "baseline version 0" the
-- first time it runs, and only apply V2 and later on top of it -- it will
-- NOT re-run V1 against a database that already has these tables. On an
-- existing dev database, verify the existing schema actually matches this
-- file (it should, since this was generated from the same entities); if it
-- doesn't, the cleanest fix for a non-production dev database is to drop it
-- and let Flyway create it fresh from V1 onward.

SET NAMES utf8mb4;

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

CREATE TABLE students (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    register_number     VARCHAR(30)   NOT NULL,
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
    CONSTRAINT uq_students_register_number UNIQUE (register_number),
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
