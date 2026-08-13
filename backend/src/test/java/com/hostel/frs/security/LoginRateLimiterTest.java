package com.hostel.frs.security;

import com.hostel.frs.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginRateLimiterTest {

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new LoginRateLimiter();
        ReflectionTestUtils.setField(rateLimiter, "enabled", true);
        ReflectionTestUtils.setField(rateLimiter, "maxAttempts", 3);
        ReflectionTestUtils.setField(rateLimiter, "windowMinutes", 1);
    }

    @Test
    void allowsRequestsUpToTheLimit() {
        assertThatCode(() -> {
            rateLimiter.checkAllowed("10.0.0.1");
            rateLimiter.checkAllowed("10.0.0.1");
            rateLimiter.checkAllowed("10.0.0.1");
        }).doesNotThrowAnyException();
    }

    @Test
    void blocksTheRequestThatExceedsTheLimit() {
        rateLimiter.checkAllowed("10.0.0.2");
        rateLimiter.checkAllowed("10.0.0.2");
        rateLimiter.checkAllowed("10.0.0.2");

        assertThatThrownBy(() -> rateLimiter.checkAllowed("10.0.0.2"))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void tracksDifferentIpsIndependently() {
        rateLimiter.checkAllowed("10.0.0.3");
        rateLimiter.checkAllowed("10.0.0.3");
        rateLimiter.checkAllowed("10.0.0.3");

        // A different IP should not be affected by 10.0.0.3 hitting its limit.
        assertThatCode(() -> rateLimiter.checkAllowed("10.0.0.4")).doesNotThrowAnyException();
    }

    @Test
    void doesNothingWhenDisabled() {
        ReflectionTestUtils.setField(rateLimiter, "enabled", false);
        assertThatCode(() -> {
            for (int i = 0; i < 100; i++) {
                rateLimiter.checkAllowed("10.0.0.5");
            }
        }).doesNotThrowAnyException();
    }
}
