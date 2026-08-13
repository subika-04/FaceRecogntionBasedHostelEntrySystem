package com.hostel.frs.validation;

import org.springframework.stereotype.Component;

@Component
public class ThresholdSettingValidator implements SettingValidator {

    @Override
    public boolean supports(String key) {
        return "RECOGNITION_THRESHOLD".equalsIgnoreCase(key);
    }

    @Override
    public void validate(String value) throws IllegalArgumentException {
        try {
            double val = Double.parseDouble(value);
            if (val < 0.0 || val > 1.0) {
                throw new IllegalArgumentException("RECOGNITION_THRESHOLD must be a decimal value between 0.0 and 1.0 inclusive.");
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("RECOGNITION_THRESHOLD must be a valid decimal number.");
        }
    }
}
