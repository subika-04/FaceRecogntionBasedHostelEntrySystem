package com.hostel.frs.service;

import com.hostel.frs.dto.request.LoginRequest;
import com.hostel.frs.dto.response.LoginResponse;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.entity.Role;
import com.hostel.frs.entity.User;
import com.hostel.frs.entity.UserStatus;
import com.hostel.frs.exception.AccountLockedException;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.UserRepository;
import com.hostel.frs.security.JwtTokenProvider;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordPolicyService passwordPolicyService;
    @Mock private ActivityLogService auditLogService;
    @Mock private UserMapper userMapper;

    private AuthService authService;

    private User activeUser;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        ReflectionTestUtils.setField(authService, "authenticationManager", authenticationManager);
        ReflectionTestUtils.setField(authService, "tokenProvider", tokenProvider);
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "refreshTokenService", refreshTokenService);
        ReflectionTestUtils.setField(authService, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(authService, "passwordPolicyService", passwordPolicyService);
        ReflectionTestUtils.setField(authService, "auditLogService", auditLogService);
        ReflectionTestUtils.setField(authService, "userMapper", userMapper);
        ReflectionTestUtils.setField(authService, "meterRegistry", new SimpleMeterRegistry());
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 900000L);
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", 15);

        staffRole = Role.builder().id(2L).name("STAFF").build();
        activeUser = User.builder()
                .id(10L)
                .username("jdoe")
                .email("jdoe@example.com")
                .fullName("Jane Doe")
                .passwordHash("hashed")
                .role(staffRole)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .lockedUntil(null)
                .build();
    }

    @Test
    void locksAccountAfterMaxFailedAttempts() {
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad creds"));

        activeUser.setFailedLoginAttempts(4); // one more failure should trip the lock (max = 5)

        assertThatThrownBy(() -> authService.authenticate(new LoginRequest("jdoe", "wrong"), "127.0.0.1", "test-agent"))
                .isInstanceOf(UnauthorizedException.class);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(savedUser.capture());
        User finalState = savedUser.getValue();

        assertThat(finalState.getLockedUntil()).isNotNull();
        assertThat(finalState.getLockedUntil()).isAfter(LocalDateTime.now());
        assertThat(finalState.getFailedLoginAttempts()).isZero(); // reset to 0 once locked
        verify(auditLogService).log(eq(activeUser), eq("ACCOUNT_LOCKED"), eq("USER"), eq(10L), anyString());
    }

    @Test
    void rejectsLoginImmediatelyWhenAccountIsCurrentlyLocked() {
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.authenticate(new LoginRequest("jdoe", "whatever"), "127.0.0.1", "test-agent"))
                .isInstanceOf(AccountLockedException.class)
                .hasMessageContaining("locked");

        // Locked-account short-circuit must never even reach AuthenticationManager.
        verifyNoInteractions(authenticationManager);
    }

    @Test
    void allowsLoginOnceLockoutWindowHasPassed() {
        activeUser.setLockedUntil(LocalDateTime.now().minusMinutes(1)); // lock expired 1 minute ago
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));

        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("jdoe").password("hashed").authorities("ROLE_STAFF").build();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userMapper.toResponse(any())).thenReturn(UserResponse.builder().id(10L).username("jdoe").build());

        LoginResponse response = authService.authenticate(new LoginRequest("jdoe", "correct"), "127.0.0.1", "test-agent");

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(activeUser.getLockedUntil()).isNull(); // cleared on success
        assertThat(activeUser.getFailedLoginAttempts()).isZero();
        verify(refreshTokenService).issue(activeUser, "refresh-token", "127.0.0.1", "test-agent");
        verify(auditLogService).log(activeUser, "LOGIN_SUCCESS", "USER", 10L, "User logged in successfully");
    }

    @Test
    void successfulLoginResetsPreviousFailedAttemptCount() {
        activeUser.setFailedLoginAttempts(3); // a few prior failures, but not locked
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));

        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("jdoe").password("hashed").authorities("ROLE_STAFF").build();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userMapper.toResponse(any())).thenReturn(UserResponse.builder().id(10L).build());

        authService.authenticate(new LoginRequest("jdoe", "correct"), "127.0.0.1", "ua");

        assertThat(activeUser.getFailedLoginAttempts()).isZero();
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong-old", "hashed")).thenReturn(false);

        com.hostel.frs.dto.request.ChangePasswordRequest request = new com.hostel.frs.dto.request.ChangePasswordRequest();
        request.setOldPassword("wrong-old");
        request.setNewPassword("NewPass123!");

        assertThatThrownBy(() -> authService.changePassword("jdoe", request))
                .isInstanceOf(UnauthorizedException.class);

        verify(passwordPolicyService, never()).validate(anyString());
        verify(refreshTokenService, never()).revokeAllForUser(any());
    }

    @Test
    void changePasswordRevokesAllOtherSessionsOnSuccess() {
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct-old", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123!")).thenReturn("new-hashed");
        when(refreshTokenService.revokeAllForUser(10L)).thenReturn(2);

        com.hostel.frs.dto.request.ChangePasswordRequest request = new com.hostel.frs.dto.request.ChangePasswordRequest();
        request.setOldPassword("correct-old");
        request.setNewPassword("NewPass123!");

        authService.changePassword("jdoe", request);

        verify(passwordPolicyService).validate("NewPass123!");
        verify(userRepository).save(activeUser);
        assertThat(activeUser.getPasswordHash()).isEqualTo("new-hashed");
        verify(refreshTokenService).revokeAllForUser(10L);
    }

    @Test
    void recordsLoginMetricsForSuccessLockoutAndFailureCases() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        ReflectionTestUtils.setField(authService, "meterRegistry", registry);

        // Locked account -> attempts + locked counters increment.
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(5));
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));
        assertThatThrownBy(() -> authService.authenticate(new LoginRequest("jdoe", "x"), "ip", "ua"))
                .isInstanceOf(AccountLockedException.class);

        assertThat(registry.get("frhes.login.attempts.total").counter().count()).isEqualTo(1.0);
        assertThat(registry.get("frhes.login.locked.total").counter().count()).isEqualTo(1.0);
    }

    @Test
    void recordsSuccessMetricOnSuccessfulLogin() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        ReflectionTestUtils.setField(authService, "meterRegistry", registry);

        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(activeUser));
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("jdoe").password("hashed").authorities("ROLE_STAFF").build();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userMapper.toResponse(any())).thenReturn(UserResponse.builder().id(10L).build());

        authService.authenticate(new LoginRequest("jdoe", "correct"), "ip", "ua");

        assertThat(registry.get("frhes.login.attempts.total").counter().count()).isEqualTo(1.0);
        assertThat(registry.get("frhes.login.success.total").counter().count()).isEqualTo(1.0);
    }
}
