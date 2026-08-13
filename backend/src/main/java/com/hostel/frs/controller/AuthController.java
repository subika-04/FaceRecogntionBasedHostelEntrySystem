package com.hostel.frs.controller;

import com.hostel.frs.dto.request.ChangePasswordRequest;
import com.hostel.frs.dto.request.LoginRequest;
import com.hostel.frs.dto.response.LoginResponse;
import com.hostel.frs.dto.response.TokenRefreshResult;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.security.LoginRateLimiter;
import com.hostel.frs.service.AuthService;
import com.hostel.frs.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private LoginRateLimiter loginRateLimiter;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long jwtRefreshExpirationMs;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    // Set to true in production (behind HTTPS) via a profile-specific override;
    // kept false here so local HTTP development still works out of the box.
    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                                HttpServletRequest httpRequest) {
        String clientIp = ClientIpResolver.resolve(httpRequest);
        // Per-IP throttle checked before we even touch the DB/AuthenticationManager.
        loginRateLimiter.checkAllowed(clientIp);

        LoginResponse response = authService.authenticate(loginRequest, clientIp, httpRequest.getHeader("User-Agent"));

        ResponseCookie cookie = buildRefreshCookie(response.getRefreshToken(), jwtRefreshExpirationMs / 1000);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new UnauthorizedException("Refresh token cookie is missing");
        }

        String clientIp = ClientIpResolver.resolve(httpRequest);
        TokenRefreshResult result = authService.refreshAccessToken(refreshToken, clientIp, httpRequest.getHeader("User-Agent"));

        // Refresh tokens rotate on every use: the old one was just revoked
        // server-side, so the cookie must be replaced with the new one or
        // the *next* refresh call would fail.
        ResponseCookie cookie = buildRefreshCookie(result.getRefreshToken(), jwtRefreshExpirationMs / 1000);

        Map<String, Object> body = new HashMap<>();
        body.put("accessToken", result.getAccessToken());
        body.put("expiresIn", result.getExpiresInSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        // Actually revoke the session server-side now (previously this only
        // cleared the browser cookie; the JWT itself stayed valid until it
        // naturally expired, up to 7 days later).
        authService.logout(refreshToken);

        ResponseCookie cookie = buildRefreshCookie("", 0);

        Map<String, String> body = new HashMap<>();
        body.put("message", "Logged out successfully");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {

        authService.changePassword(userDetails.getUsername(), request);

        Map<String, String> body = new HashMap<>();
        body.put("message", "Password changed successfully. You have been signed out of all other sessions.");

        return ResponseEntity.ok(body);
    }

    private ResponseCookie buildRefreshCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }
}
