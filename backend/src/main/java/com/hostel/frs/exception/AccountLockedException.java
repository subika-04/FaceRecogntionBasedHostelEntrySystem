package com.hostel.frs.exception;

/** Mapped to HTTP 423 (Locked) by GlobalExceptionHandler. */
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}
