package com.hostel.frs.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Every error response the API returns now has exactly this shape. This
 * replaces the previous approach of building an ad-hoc `HashMap<String,
 * Object>` inline in every `@ExceptionHandler` method in
 * GlobalExceptionHandler -- functionally the same fields
 * (`timestamp`/`status`/`error`/`message`) are still present with the same
 * names and types, so no existing frontend code that reads those fields
 * breaks. `path` and `errorCode` are new, additive fields (null-omitted via
 * `@JsonInclude(NON_NULL)` where genuinely unused) that give API consumers
 * and support tooling more to work with than the old shape did.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    /** Stable, machine-readable identifier for this error type (e.g.
     *  "ACCOUNT_LOCKED", "VALIDATION_ERROR") -- useful for frontend code
     *  that wants to branch on error type without string-matching `message`,
     *  which is meant for humans and may be reworded over time. */
    private String errorCode;
    /** Only populated for field-validation failures: fieldName -> message. */
    private Map<String, String> errors;
}
