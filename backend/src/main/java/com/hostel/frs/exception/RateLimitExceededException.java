package com.hostel.frs.exception;

/** Mapped to HTTP 429 (Too Many Requests) by GlobalExceptionHandler. */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
