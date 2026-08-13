package com.hostel.frs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Returned by AuthService.refreshAccessToken() now that refresh tokens
 * rotate on every use (a new refresh token is issued and the old one
 * revoked each time /auth/refresh is called) -- AuthController needs both
 * values to hand back a new access token in the JSON body *and* set a new
 * refresh-token cookie.
 */
@Getter
@AllArgsConstructor
public class TokenRefreshResult {
    private final String accessToken;
    private final String refreshToken;
    private final long expiresInSeconds;
}
