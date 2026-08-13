package com.hostel.frs.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Enforces the `PASSWORD_POLICY` system setting.
 *
 * Before this class existed, `PASSWORD_POLICY` was a value an admin could
 * set via the Settings screen (validated by
 * {@link com.hostel.frs.validation.PasswordPolicySettingValidator} to be one
 * of STRICT/MEDIUM/SIMPLE/LOW) that had **no effect anywhere** -- nothing in
 * the codebase ever read it back to actually check a password against it.
 * This service is what closes that loop: {@code AuthService.changePassword}
 * and the new {@code UserService.createUser}/{@code resetPassword} all call
 * {@link #validate(String)} before accepting a new password.
 *
 * The policy is read through {@link SettingsService#getSettingValue}, so it
 * benefits from the same cache and defaults to MEDIUM if the setting row is
 * ever missing (e.g. a fresh database before the Flyway seed migration ran,
 * or a key that was deleted by mistake) rather than failing closed or open.
 */
@Service
@Slf4j
public class PasswordPolicyService {

    @Autowired
    private SettingsService settingsService;

    public enum Level { LOW, SIMPLE, MEDIUM, STRICT }

    public Level currentLevel() {
        String raw = settingsService.getSettingValue("PASSWORD_POLICY");
        if (raw == null) {
            return Level.MEDIUM;
        }
        try {
            return Level.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unrecognized PASSWORD_POLICY value '{}' in system_settings; defaulting to MEDIUM.", raw);
            return Level.MEDIUM;
        }
    }

    /**
     * @throws IllegalArgumentException with a user-facing message describing
     *         exactly which rule failed (caught by GlobalExceptionHandler and
     *         turned into a 400 response).
     */
    public void validate(String rawPassword) {
        if (rawPassword == null) {
            throw new IllegalArgumentException("Password is required.");
        }

        Level level = currentLevel();
        int minLength = switch (level) {
            case LOW -> 6;
            case SIMPLE -> 8;
            case MEDIUM -> 8;
            case STRICT -> 10;
        };

        if (rawPassword.length() < minLength) {
            throw new IllegalArgumentException(
                    String.format("Password must be at least %d characters long (current policy: %s).", minLength, level));
        }

        boolean hasUpper = rawPassword.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = rawPassword.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = rawPassword.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = rawPassword.chars().anyMatch(c -> !Character.isLetterOrDigit(c) && !Character.isWhitespace(c));
        boolean hasNoWhitespace = rawPassword.chars().noneMatch(Character::isWhitespace);

        if (!hasNoWhitespace) {
            throw new IllegalArgumentException("Password must not contain whitespace.");
        }

        switch (level) {
            case LOW -> { /* length only */ }
            case SIMPLE -> {
                if (!hasDigit) {
                    throw new IllegalArgumentException("Password must contain at least one digit (current policy: SIMPLE).");
                }
            }
            case MEDIUM -> {
                if (!hasDigit || !(hasUpper || hasLower)) {
                    throw new IllegalArgumentException(
                            "Password must contain at least one letter and one digit (current policy: MEDIUM).");
                }
            }
            case STRICT -> {
                if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
                    throw new IllegalArgumentException(
                            "Password must contain uppercase, lowercase, a digit, and a special character (current policy: STRICT).");
                }
            }
        }
    }
}
