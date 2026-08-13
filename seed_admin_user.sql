-- seed_admin_user.sql
--
-- Creates one sample ADMIN user for local/dev login, safe to re-run.
--
-- Login credentials:
--   username: admin
--   password: 12345678
--
-- The password hash below is a real BCrypt hash (strength 10, matching
-- Spring Security's default BCryptPasswordEncoder used by this app --
-- see backend/src/main/java/com/hostel/frs/config/SecurityConfig.java)
-- generated for the plaintext password "12345678" and verified to match.
--
-- Heads-up: this app's PASSWORD_POLICY system setting defaults to MEDIUM,
-- which requires at least one letter AND one digit for any password set
-- *through the app* (registration, password change, admin reset). Since
-- this script inserts the hash directly into the database, that check is
-- bypassed for this one-time seed -- but if this user (or anyone) later
-- tries to change their password via Settings/Profile using "12345678"
-- again, MEDIUM policy will reject it for having no letters. Fine for a
-- disposable dev login; don't use this password anywhere real.
--
-- Usage (from a shell with mysql client access to the frhes database):
--   mysql -h 127.0.0.1 -P 3307 -u frhes_app -p frhes < seed_admin_user.sql
-- (adjust host/port/user to match your .env -- this project's
-- docker-compose.yml maps MySQL to host port 3307, not the default 3306)

SET NAMES utf8mb4;

-- Only insert if a user with this username doesn't already exist, so this
-- script is safe to run more than once without erroring on the unique
-- constraint on `username`.
INSERT INTO users (
    full_name,
    email,
    username,
    password_hash,
    phone,
    role_id,
    status,
    created_at,
    updated_at,
    failed_login_attempts
)
SELECT
    'Admin User',
    'admin@frhes.local',
    'admin',
    '$2a$10$v.JcRzKEa4JucIh1y/OphuHXU1kkASgdVhdF1wwXwYma3D71UZzq.',
    NULL,
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    'ACTIVE',
    NOW(),
    NOW(),
    0
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);
