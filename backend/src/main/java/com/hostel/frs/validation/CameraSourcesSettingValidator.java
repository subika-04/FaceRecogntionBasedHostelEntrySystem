package com.hostel.frs.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CameraSourcesSettingValidator implements SettingValidator {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String key) {
        return "CAMERA_SOURCES".equalsIgnoreCase(key);
    }

    @Override
    public void validate(String value) throws IllegalArgumentException {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("CAMERA_SOURCES setting cannot be empty.");
        }

        // Try to parse as valid JSON array/object first
        try {
            objectMapper.readTree(value);
        } catch (Exception e) {
            // Fallback: Check if it's a non-empty comma-separated list
            String[] parts = value.split(",");
            for (String part : parts) {
                if (part.trim().isEmpty()) {
                    throw new IllegalArgumentException("CAMERA_SOURCES must be a valid JSON array or a non-empty comma-separated list.");
                }
            }
        }
    }
}
