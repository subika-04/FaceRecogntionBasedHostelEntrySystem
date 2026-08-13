package com.hostel.frs.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Single place to resolve "the real client IP" from a request, honoring
 * X-Forwarded-For when the app is behind a reverse proxy/load balancer.
 * Previously this exact logic was duplicated inline inside
 * ActivityLogService; centralizing it here means LoginRateLimiter's
 * IP-based throttling and the audit log's IP field can never drift out of
 * sync with each other.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }
}
