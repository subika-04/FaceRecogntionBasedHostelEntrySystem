-- V4__seed_default_settings.sql
--
-- Before this migration, `system_settings` started completely empty on a
-- fresh install. That's a real functional gap: SettingsController's
-- updateSetting() can only UPDATE an existing row
-- (systemSettingRepository.findByKey(key).orElseThrow(...)) -- it has no
-- "create if missing" path. Without these seed rows, an admin opening the
-- Settings screen for the first time would have nothing to edit, and
-- RECOGNITION_THRESHOLD / PASSWORD_POLICY could never actually be changed
-- through the UI even though validators for both already existed in code.
--
-- `updated_by` is left NULL (system-seeded, not set by any admin) --
-- SettingsService.mapToResponse() already handles that by reporting
-- "SYSTEM" as the updatedByUsername in that case.

INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at) VALUES
    ('RECOGNITION_THRESHOLD', '0.60', NULL, NOW()),
    ('PASSWORD_POLICY', 'MEDIUM', NULL, NOW()),
    ('CAMERA_SOURCES', '["CAM01"]', NULL, NOW()),
    ('JWT_ACCESS_TOKEN_EXPIRY', '900000', NULL, NOW()),
    ('JWT_REFRESH_TOKEN_EXPIRY', '604800000', NULL, NOW());
