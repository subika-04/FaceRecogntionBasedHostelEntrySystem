package com.hostel.frs.service;

import com.hostel.frs.dto.request.ChangePasswordRequest;
import com.hostel.frs.dto.request.LoginRequest;
import com.hostel.frs.dto.response.LoginResponse;
import com.hostel.frs.dto.response.TokenRefreshResult;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.entity.RefreshToken;
import com.hostel.frs.entity.User;
import com.hostel.frs.entity.UserStatus;
import com.hostel.frs.exception.AccountLockedException;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.UserRepository;
import com.hostel.frs.security.JwtTokenProvider;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Owns exactly one job: deciding whether a login/refresh/logout/password-change
 * attempt is allowed, and issuing the resulting tokens. Everything about
 * *how* a refresh token is stored, validated against revocation, rotated, or
 * cleaned up lives in RefreshTokenService -- see that class's javadoc for
 * why the split exists.
 */
@Service
@Slf4j
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordPolicyService passwordPolicyService;

    @Autowired
    private ActivityLogService auditLogService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private MeterRegistry meterRegistry;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.security.lockout.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.security.lockout.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    @Transactional
    public LoginResponse authenticate(LoginRequest loginRequest, String clientIp, String userAgent) {
        meterRegistry.counter("frhes.login.attempts.total").increment();

        Optional<User> existingUser = userRepository.findByUsername(loginRequest.getUsername())
                .or(() -> userRepository.findByEmail(loginRequest.getUsername()));

        // Lockout check happens BEFORE AuthenticationManager is ever touched,
        // and stays outside the try/catch below so it can never be caught and
        // rewritten into a generic "invalid credentials" message.
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                long minutesRemaining = Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
                auditLogService.log(user, "LOGIN_BLOCKED_LOCKED", "USER", user.getId(),
                        "Login attempt rejected: account locked for " + minutesRemaining + " more minute(s)");
                meterRegistry.counter("frhes.login.locked.total").increment();
                throw new AccountLockedException(
                        "This account is temporarily locked due to repeated failed login attempts. " +
                        "Try again in " + minutesRemaining + " minute(s), or contact an administrator.");
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));

            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);
            refreshTokenService.issue(user, refreshToken, clientIp, userAgent);

            auditLogService.log(user, "LOGIN_SUCCESS", "USER", user.getId(), "User logged in successfully");
            meterRegistry.counter("frhes.login.success.total").increment();

            UserResponse userResponse = userMapper.toResponse(user);

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(jwtExpirationMs / 1000)
                    .user(userResponse)
                    .build();

        } catch (AuthenticationException e) {
            log.warn("Login failed for username '{}': {}", loginRequest.getUsername(), e.toString());
            meterRegistry.counter("frhes.login.failure.total").increment();
            registerFailedAttempt(existingUser, e.getMessage());
            throw new UnauthorizedException("Invalid username, email, or password");
        }
    }

    private void registerFailedAttempt(Optional<User> existingUser, String reason) {
        try {
            existingUser.ifPresent(user -> {
                int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
                user.setFailedLoginAttempts(attempts);

                if (attempts >= maxFailedAttempts) {
                    user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                    user.setFailedLoginAttempts(0);
                    userRepository.save(user);
                    auditLogService.log(user, "ACCOUNT_LOCKED", "USER", user.getId(),
                            String.format("Account locked for %d minute(s) after %d consecutive failed login attempts",
                                    lockoutDurationMinutes, maxFailedAttempts));
                    log.warn("Account '{}' locked for {} minutes after {} failed attempts",
                            user.getUsername(), lockoutDurationMinutes, maxFailedAttempts);
                } else {
                    userRepository.save(user);
                    auditLogService.log(user, "LOGIN_FAILURE", "USER", user.getId(),
                            String.format("Failed login attempt %d/%d: %s", attempts, maxFailedAttempts, reason));
                }
            });
        } catch (Exception auditEx) {
            log.warn("Failed to update lockout state / write LOGIN_FAILURE audit log: {}", auditEx.toString());
        }
    }

    @Transactional
    public TokenRefreshResult refreshAccessToken(String refreshToken, String clientIp, String userAgent) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        RefreshToken storedToken = refreshTokenService.requireValid(refreshToken);

        String username = tokenProvider.getUsernameFromJWT(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid token user principal"));

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new UnauthorizedException("User account is inactive");
        }

        // Rotate: revoke the token that was just used, issue a fresh one.
        refreshTokenService.revoke(storedToken);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().getName())
                .build();
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRefreshToken = tokenProvider.generateRefreshToken(authentication);
        refreshTokenService.issue(user, newRefreshToken, clientIp, userAgent);

        return new TokenRefreshResult(newAccessToken, newRefreshToken, jwtExpirationMs / 1000);
    }

    /** Revokes exactly the session (refresh token) being logged out of. */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeByRawToken(refreshToken);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            auditLogService.log(user, "PASSWORD_CHANGE_FAIL", "USER", user.getId(), "Current password mismatch");
            throw new UnauthorizedException("Current password does not match");
        }

        passwordPolicyService.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Security-sensitive action -> invalidate every other active session
        // for this account (matches common "sign out everywhere" behavior).
        int revoked = refreshTokenService.revokeAllForUser(user.getId());

        auditLogService.log(user, "PASSWORD_CHANGED", "USER", user.getId(),
                "User changed password successfully; " + revoked + " other active session(s) revoked");
    }
}
