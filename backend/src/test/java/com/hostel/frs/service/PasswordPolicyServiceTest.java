package com.hostel.frs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordPolicyServiceTest {

    @Mock
    private SettingsService settingsService;

    @InjectMocks
    private PasswordPolicyService passwordPolicyService;

    @BeforeEach
    void setUp() {
        // Individual tests override this stub where a different level is needed.
    }

    @Test
    void defaultsToMediumWhenSettingRowIsMissing() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn(null);
        assertThat(passwordPolicyService.currentLevel()).isEqualTo(PasswordPolicyService.Level.MEDIUM);
    }

    @Test
    void defaultsToMediumWhenSettingValueIsUnrecognized() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("NOT_A_REAL_LEVEL");
        assertThat(passwordPolicyService.currentLevel()).isEqualTo(PasswordPolicyService.Level.MEDIUM);
    }

    @Test
    void lowPolicyOnlyChecksLength() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("LOW");
        passwordPolicyService.validate("abcdef"); // 6 chars, no complexity -- should pass under LOW

        assertThatThrownBy(() -> passwordPolicyService.validate("abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 6 characters");
    }

    @Test
    void simplePolicyRequiresADigit() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("SIMPLE");
        passwordPolicyService.validate("abcdefg1");

        assertThatThrownBy(() -> passwordPolicyService.validate("abcdefgh"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("digit");
    }

    @Test
    void mediumPolicyRequiresLetterAndDigit() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("MEDIUM");
        passwordPolicyService.validate("abcdefg1");

        assertThatThrownBy(() -> passwordPolicyService.validate("12345678"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("letter and one digit");
    }

    @Test
    void strictPolicyRequiresUpperLowerDigitAndSpecialChar() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("STRICT");
        passwordPolicyService.validate("Abcdefgh1!");

        assertThatThrownBy(() -> passwordPolicyService.validate("abcdefgh1!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("uppercase");

        assertThatThrownBy(() -> passwordPolicyService.validate("Abcdefghi1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("special character");
    }

    @Test
    void rejectsPasswordsContainingWhitespaceRegardlessOfPolicy() {
        when(settingsService.getSettingValue("PASSWORD_POLICY")).thenReturn("LOW");
        assertThatThrownBy(() -> passwordPolicyService.validate("abc def"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("whitespace");
    }

    @Test
    void rejectsNullPassword() {
        assertThatThrownBy(() -> passwordPolicyService.validate(null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
