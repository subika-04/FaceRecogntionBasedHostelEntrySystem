package com.hostel.frs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Before this entity existed, "logout" only cleared the browser's cookie --
 * the refresh token itself was a self-contained JWT that stayed valid on the
 * server side until it naturally expired (up to 7 days later). A stolen
 * refresh token couldn't be revoked, and changing your password didn't log
 * out any other device using it.
 *
 * This table is the server-side source of truth for "is this refresh token
 * still good": every refresh token issued has a matching row here (storing a
 * SHA-256 hash of the token, never the raw token itself), and
 * AuthService checks + rotates this row on every /auth/refresh call. Logout
 * revokes the specific row for that session; changing your password revokes
 * every row for that user (all-device logout), matching common enterprise
 * security-sensitive-action behavior.
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_tokens_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "idx_refresh_tokens_user_id", columnList = "user_id"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // SHA-256 hex digest of the actual JWT refresh token -- never store the
    // raw token, exactly as you would never store a raw password.
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // IP/user-agent captured at issuance purely for the security-conscious
    // user (or an admin investigating a compromised account) to be able to
    // tell sessions apart -- not used for any access-control decision.
    @Column(name = "created_ip", length = 45)
    private String createdIp;

    @Column(name = "created_user_agent", length = 255)
    private String createdUserAgent;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (revoked == null) {
            revoked = false;
        }
    }

    public boolean isValid() {
        return !Boolean.TRUE.equals(revoked) && expiresAt.isAfter(LocalDateTime.now());
    }
}
