package com.hostel.frs.service;

import com.hostel.frs.entity.RefreshToken;
import com.hostel.frs.entity.User;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;

/**
 * Owns the full lifecycle of persisted refresh tokens: issuance, rotation,
 * per-session revocation (logout), bulk revocation (password change / admin
 * "force logout everywhere"), and periodic cleanup of rows that are no
 * longer useful to keep around.
 *
 * This used to be logic embedded directly inside AuthService. Pulling it out
 * gives AuthService a single job (authenticate a login attempt) and this
 * class a single job (manage refresh token state) -- and makes both
 * independently unit-testable, and makes the multi-device-session and
 * "force logout everywhere" behaviors reusable from UserService too (an
 * admin deactivating a user should also kill their active sessions -- see
 * UserService.deactivateUser).
 */
@Service
@Slf4j
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long jwtRefreshExpirationMs;

    @Transactional
    public RefreshToken issue(User user, String rawRefreshToken, String clientIp, String userAgent) {
        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(rawRefreshToken))
                .expiresAt(LocalDateTime.now().plusSeconds(jwtRefreshExpirationMs / 1000))
                .revoked(false)
                .createdIp(clientIp)
                .createdUserAgent(truncate(userAgent, 255))
                .build();
        return refreshTokenRepository.save(entity);
    }

    /**
     * Looks up the persisted record for a raw refresh token and confirms
     * it is still valid (not revoked, not expired). Callers are expected to
     * have already verified the JWT signature/expiry themselves
     * (JwtTokenProvider.validateToken) -- this is the *second*, independent
     * check against server-side revocation state that a JWT alone can't provide.
     */
    @Transactional(readOnly = true)
    public RefreshToken requireValid(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken))
                .orElseThrow(() -> new UnauthorizedException(
                        "Refresh token was not recognized (already used, logged out, or revoked)"));
        if (!stored.isValid()) {
            throw new UnauthorizedException("Refresh token has been revoked or has expired");
        }
        return stored;
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);
    }

    @Transactional
    public void revokeByRawToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken)).ifPresent(this::revoke);
    }

    /** Used on password change and on admin deactivation -- kills every active session for a user. */
    @Transactional
    public int revokeAllForUser(Long userId) {
        int revoked = refreshTokenRepository.revokeAllActiveForUser(userId);
        log.info("Revoked {} active refresh token(s) for user id={}", revoked, userId);
        return revoked;
    }

    /**
     * Runs daily so a long-lived instance's `refresh_tokens` table doesn't
     * grow forever with rows that can never be valid again. Purely
     * housekeeping -- correctness never depends on this having run recently,
     * since expiry/revocation are already checked on every read.
     */
    @Scheduled(cron = "0 30 3 * * *") // 03:30 server time, daily
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteAllExpiredBefore(LocalDateTime.now().minusDays(1));
        if (deleted > 0) {
            log.info("RefreshTokenService cleanup: removed {} expired refresh token row(s).", deleted);
        }
    }

    private String truncate(String value, int maxLength) {
        return (value != null && value.length() > maxLength) ? value.substring(0, maxLength) : value;
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
