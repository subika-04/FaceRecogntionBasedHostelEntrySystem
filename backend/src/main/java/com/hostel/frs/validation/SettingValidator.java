package com.hostel.frs.validation;

public interface SettingValidator {
    boolean supports(String key);
    void validate(String value) throws IllegalArgumentException;
}
