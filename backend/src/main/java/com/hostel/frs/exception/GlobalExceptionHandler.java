package com.hostel.frs.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Single place every exception in the app is translated into an HTTP
 * response, using the standardized ErrorResponse shape (see that class's
 * javadoc for why the refactor from ad-hoc HashMaps is non-breaking).
 *
 * Handlers are grouped by category to match how Phase A's brief described
 * them: business exceptions, auth/authz, validation, database, AI service,
 * and file upload -- each maps to a distinct, semantically correct HTTP
 * status rather than everything collapsing to a generic 400/500.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ---------------------------------------------------------- Business exceptions

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        return build(ex.getMessage(), HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", request);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex, WebRequest request) {
        return build(ex.getMessage(), HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        // Thrown by PasswordPolicyService and other business-rule checks that
        // aren't expressible as a static Bean Validation annotation.
        return build(ex.getMessage(), HttpStatus.BAD_REQUEST, "BUSINESS_RULE_VIOLATION", request);
    }

    // ---------------------------------------------------- Authentication / authorization

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex, WebRequest request) {
        return build(ex.getMessage(), HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        // Spring Security's own exception, in case it ever escapes AuthService
        // (which normally catches AuthenticationException and rethrows as
        // UnauthorizedException) -- kept generic on purpose, never echoing
        // whether the username or the password was wrong.
        return build("Invalid username, email, or password", HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        // Thrown by @PreAuthorize method-security checks (e.g. UserController);
        // URL-level denials are handled by RoleBasedAccessDeniedHandler instead,
        // but method-level denials surface here.
        return build("You do not have permission to perform this action.", HttpStatus.FORBIDDEN, "ACCESS_DENIED", request);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex, WebRequest request) {
        return build(ex.getMessage(), HttpStatus.LOCKED, "ACCOUNT_LOCKED", request);
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex, WebRequest request) {
        return build(ex.getMessage(), HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", request);
    }

    // -------------------------------------------------------------------- Validation

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null ? fieldError.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing, // keep the first message if a field has multiple violations
                        HashMap::new));

        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Validation failed for one or more fields.")
                .errorCode("VALIDATION_ERROR")
                .path(path(request))
                .errors(errors)
                .build();

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ---------------------------------------------------------------------- Database

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
        // Catches constraint violations that slip past application-level checks
        // (e.g. a race between two concurrent requests both passing a
        // pre-save uniqueness check before either has committed) -- reported
        // as 409 Conflict rather than leaking the raw SQL exception message
        // (which can include table/column names) back to the client.
        log.warn("Data integrity violation: {}", ex.getMessage());
        return build("This operation conflicts with existing data (a unique field may already be in use).",
                HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", request);
    }

    // --------------------------------------------------------------------- AI service

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ErrorResponse> handleAiService(AiServiceException ex, WebRequest request) {
        // 502 Bad Gateway: this backend is itself functioning correctly, but
        // its upstream dependency (the Flask AI service) is not -- distinct
        // from this backend's own 500s, which is exactly the ambiguity the
        // audit's AiServiceHealthIndicator was written to resolve at the
        // /actuator/health level too.
        return build(ex.getMessage(), HttpStatus.BAD_GATEWAY, "AI_SERVICE_ERROR", request);
    }

    // ------------------------------------------------------------------- File upload

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex, WebRequest request) {
        return build("Uploaded file exceeds the maximum allowed size (10MB).",
                HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", request);
    }

    // ------------------------------------------------------------------------ Catch-all

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
        log.error("Unhandled exception reached the global handler", ex);
        return build(ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
                HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", request);
    }

    private ResponseEntity<ErrorResponse> build(String message, HttpStatus status, String errorCode, WebRequest request) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .errorCode(errorCode)
                .path(path(request))
                .build();
        return new ResponseEntity<>(body, status);
    }

    private String path(WebRequest request) {
        String description = request.getDescription(false); // "uri=/api/v1/..."
        return description.startsWith("uri=") ? description.substring(4) : description;
    }
}
