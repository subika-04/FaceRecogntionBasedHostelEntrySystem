-- V3__refresh_tokens.sql
--
-- Backs RefreshTokenService / RefreshToken entity. See RefreshToken.java's
-- javadoc for why this table exists: it's what makes logout and
-- password-change actually revoke a session server-side, instead of a
-- refresh token JWT staying valid until it naturally expires.

CREATE TABLE refresh_tokens (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    token_hash         VARCHAR(64)  NOT NULL,
    expires_at         DATETIME     NOT NULL,
    revoked            BOOLEAN      NOT NULL DEFAULT FALSE,
    revoked_at         DATETIME     NULL,
    created_at         DATETIME     NULL,
    created_ip         VARCHAR(45)  NULL,
    created_user_agent VARCHAR(255) NULL,
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every refresh call looks up by hash (unique index above already covers
-- that) and every logout-everywhere / cleanup operation scans by user_id or
-- expires_at.
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
