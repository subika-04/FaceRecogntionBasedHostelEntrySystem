package com.hostel.frs.validation;

import org.springframework.stereotype.Component;

@Component
public class GenericSettingValidator implements SettingValidator {

    @Override
    public boolean supports(String key) {
        // Fallback validator for any other keys
        return true;
    }

    @Override
    public void validate(String value) throws IllegalArgumentException {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Setting value cannot be empty.");
        }
        if (value.length() > 255) {
            throw new IllegalArgumentException("Setting value cannot exceed 255 characters.");
        }
    }
}
