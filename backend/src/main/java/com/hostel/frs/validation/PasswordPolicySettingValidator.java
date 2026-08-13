package com.hostel.frs.validation;

import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
public class PasswordPolicySettingValidator implements SettingValidator {

    private static final List<String> VALID_POLICIES = Arrays.asList("STRICT", "MEDIUM", "SIMPLE", "LOW");

    @Override
    public boolean supports(String key) {
        return "PASSWORD_POLICY".equalsIgnoreCase(key);
    }

    @Override
    public void validate(String value) throws IllegalArgumentException {
        if (value == null || !VALID_POLICIES.contains(value.toUpperCase())) {
            throw new IllegalArgumentException("PASSWORD_POLICY must be one of the predefined values: STRICT, MEDIUM, SIMPLE, or LOW.");
        }
    }
}
