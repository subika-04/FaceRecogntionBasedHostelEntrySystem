package com.hostel.frs.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.ServletWebRequest;

import jakarta.servlet.http.HttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private ServletWebRequest requestFor(String uri) {
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getRequestURI()).thenReturn(uri);
        return new ServletWebRequest(servletRequest);
    }

    @Test
    void resourceNotFoundMapsTo404WithCorrectErrorCode() {
        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(
                new ResourceNotFoundException("Student not found: 42"), requestFor("/api/v1/students/42"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("RESOURCE_NOT_FOUND");
        assertThat(response.getBody().getMessage()).isEqualTo("Student not found: 42");
        assertThat(response.getBody().getPath()).isEqualTo("/api/v1/students/42");
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void duplicateResourceMapsTo409() {
        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResource(
                new DuplicateResourceException("Username taken"), requestFor("/api/v1/users"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getErrorCode()).isEqualTo("DUPLICATE_RESOURCE");
    }

    @Test
    void accountLockedMapsTo423() {
        ResponseEntity<ErrorResponse> response = handler.handleAccountLocked(
                new AccountLockedException("Locked for 10 more minutes"), requestFor("/api/v1/auth/login"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.LOCKED);
        assertThat(response.getBody().getErrorCode()).isEqualTo("ACCOUNT_LOCKED");
    }

    @Test
    void rateLimitExceededMapsTo429() {
        ResponseEntity<ErrorResponse> response = handler.handleRateLimitExceeded(
                new RateLimitExceededException("Slow down"), requestFor("/api/v1/auth/login"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody().getErrorCode()).isEqualTo("RATE_LIMITED");
    }

    @Test
    void aiServiceExceptionMapsTo502BadGateway() {
        ResponseEntity<ErrorResponse> response = handler.handleAiService(
                new AiServiceException("AI service unreachable"), requestFor("/api/v1/recognition/identify"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(response.getBody().getErrorCode()).isEqualTo("AI_SERVICE_ERROR");
    }

    @Test
    void illegalArgumentMapsTo400ForBusinessRuleViolations() {
        ResponseEntity<ErrorResponse> response = handler.handleIllegalArgumentException(
                new IllegalArgumentException("Password must be at least 8 characters"), requestFor("/api/v1/users/5/reset-password"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getErrorCode()).isEqualTo("BUSINESS_RULE_VIOLATION");
    }

    @Test
    void unknownExceptionFallsBackTo500WithoutLeakingNullMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(
                new RuntimeException((String) null), requestFor("/api/v1/students"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_ERROR");
    }
}
