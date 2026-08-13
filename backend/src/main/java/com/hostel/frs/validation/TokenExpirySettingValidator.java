package com.hostel.frs.validation;

import org.springframework.stereotype.Component;

@Component
public class TokenExpirySettingValidator implements SettingValidator {

    @Override
    public boolean supports(String key) {
        return "JWT_ACCESS_TOKEN_EXPIRY".equalsIgnoreCase(key) || 
               "JWT_REFRESH_TOKEN_EXPIRY".equalsIgnoreCase(key);
    }

    @Override
    public void validate(String value) throws IllegalArgumentException {
        try {
            long expiry = Long.parseLong(value);
            if (expiry <= 0) {
                throw new IllegalArgumentException("JWT token expiry must be a positive integer.");
            }
            
            // Validate reasonable limits (between 5 seconds and 365 days)
            long minExpiry = 5000L; // 5 seconds
            long maxExpiry = 31536000000L; // 365 days
            
            if (expiry < minExpiry || expiry > maxExpiry) {
                throw new IllegalArgumentException("JWT token expiry is outside reasonable limits (5 seconds to 365 days).");
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("JWT token expiry must be a valid positive integer.");
        }
    }
}
