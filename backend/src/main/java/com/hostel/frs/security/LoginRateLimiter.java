package com.hostel.frs.security;

import com.hostel.frs.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Per-IP sliding-window limiter on POST /auth/login, independent of the
 * per-account lockout in AuthService -- the two guard against different
 * attack shapes: this stops one IP hammering many different usernames
 * (which per-account lockout alone wouldn't catch, since each individual
 * account might only see 1-2 failed attempts), while AuthService's lockout
 * stops many IPs credential-stuffing one specific account.
 *
 * Deliberately dependency-free (no Redis/Bucket4j) to match the project's
 * current scale -- same design and the same scaling caveat as
 * ai-service/app/rate_limit.py: this state is per-JVM-instance. If the
 * backend is ever horizontally scaled behind a load balancer, move this to
 * Redis (e.g. Bucket4j + Redis) so all instances share one counter.
 */
@Component
@Slf4j
public class LoginRateLimiter {

    @Value("${app.security.login-rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.security.login-rate-limit.max-attempts:10}")
    private int maxAttempts;

    @Value("${app.security.login-rate-limit.window-minutes:1}")
    private int windowMinutes;

    private final Map<String, ConcurrentLinkedDeque<Instant>> hitsByIp = new ConcurrentHashMap<>();

    public void checkAllowed(String clientIp) {
        if (!enabled) {
            return;
        }
        String key = (clientIp == null || clientIp.isBlank()) ? "unknown" : clientIp;
        Instant now = Instant.now();
        Instant windowStart = now.minus(Duration.ofMinutes(windowMinutes));

        ConcurrentLinkedDeque<Instant> hits = hitsByIp.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        synchronized (hits) {
            while (!hits.isEmpty() && hits.peekFirst().isBefore(windowStart)) {
                hits.pollFirst();
            }
            if (hits.size() >= maxAttempts) {
                log.warn("Login rate limit exceeded for IP {} ({} attempts in the last {} minute(s))",
                        key, hits.size(), windowMinutes);
                throw new RateLimitExceededException(
                        String.format("Too many login attempts from this address. Please wait and try again in a moment."));
            }
            hits.addLast(now);
        }
    }
}
