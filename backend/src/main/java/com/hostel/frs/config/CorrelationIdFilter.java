package com.hostel.frs.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Every request gets a correlation ID, logged via `%X{correlationId}` in
 * application.yml's log pattern (that placeholder existed in the log
 * pattern before this filter did, but printed blank on every line since
 * nothing ever populated the MDC key -- see the audit report's "Logging
 * improvements" finding).
 *
 * The ID is: read from an incoming `X-Correlation-Id` header if the caller
 * supplied one (so a request that started at the Flask AI service, or at an
 * upstream gateway, keeps the same ID across service boundaries), otherwise
 * generated fresh; and always echoed back in the response header so the
 * browser/API client can log it too and hand it to support if something
 * goes wrong.
 */
@Component
// Spring Security's entire filter chain is itself registered as ONE servlet
// filter (FilterChainProxy) at order SecurityProperties.DEFAULT_FILTER_ORDER
// (-100). JwtAuthFilter lives *inside* that chain, so to have a correlation
// ID available for security-related log lines (auth failures, lockouts,
// rate-limit rejections) too, this filter needs to run before the security
// chain as a whole -- not just "before JwtAuthFilter" within it, which
// @Order(1) would NOT achieve (1 > -100, so it would run after).
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString().substring(0, 8);
        }

        MDC.put(MDC_KEY, correlationId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        long startNanos = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            // Structured, single-line request summary -- deliberately after the
            // response is fully written so the recorded duration includes the
            // whole request, not just the point this filter handed off.
            logger.info(String.format("%s %s -> %d (%d ms)",
                    request.getMethod(), request.getRequestURI(), response.getStatus(), durationMs));
            // MDC is thread-local and this filter runs on a thread pooled by the
            // servlet container, so it MUST be cleared here or the next
            // unrelated request handled by this same thread would inherit a
            // stale correlation ID.
            MDC.remove(MDC_KEY);
        }
    }
}
