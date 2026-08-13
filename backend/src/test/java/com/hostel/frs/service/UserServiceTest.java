package com.hostel.frs.service;

import com.hostel.frs.dto.request.AdminResetPasswordRequest;
import com.hostel.frs.dto.request.RoleUpdateRequest;
import com.hostel.frs.dto.request.UserCreateRequest;
import com.hostel.frs.entity.Role;
import com.hostel.frs.entity.User;
import com.hostel.frs.entity.UserStatus;
import com.hostel.frs.exception.DuplicateResourceException;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.RoleRepository;
import com.hostel.frs.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordPolicyService passwordPolicyService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private ActivityLogService activityLogService;
    @Mock private UserMapper userMapper;

    private UserService userService;

    private User adminUser;
    private Role adminRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "roleRepository", roleRepository);
        ReflectionTestUtils.setField(userService, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(userService, "passwordPolicyService", passwordPolicyService);
        ReflectionTestUtils.setField(userService, "refreshTokenService", refreshTokenService);
        ReflectionTestUtils.setField(userService, "activityLogService", activityLogService);
        ReflectionTestUtils.setField(userService, "userMapper", userMapper);

        adminRole = Role.builder().id(1L).name("ADMIN").build();
        staffRole = Role.builder().id(2L).name("STAFF").build();
        adminUser = User.builder().id(1L).username("boss").role(adminRole).status(UserStatus.ACTIVE).build();
    }

    @Test
    void createUserRejectsDuplicateUsername() {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "new@example.com", "taken", "Pass123!", "555-1234", "STAFF", null);
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request, "boss"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username");

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUserRejectsDuplicateEmail() {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "taken@example.com", "newuser", "Pass123!", null, "STAFF", null);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request, "boss"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");
    }

    @Test
    void createUserEnforcesPasswordPolicyBeforeSaving() {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "new@example.com", "newuser", "weak", null, "STAFF", null);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        doThrow(new IllegalArgumentException("too weak")).when(passwordPolicyService).validate("weak");

        assertThatThrownBy(() -> userService.createUser(request, "boss"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).save(any());
        verify(roleRepository, never()).findByNameIgnoreCase(any());
    }

    @Test
    void createUserSucceedsAndLogsAudit() {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "new@example.com", "newuser", "Pass123!", "555-1234", "staff", null);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(roleRepository.findByNameIgnoreCase("staff")).thenReturn(Optional.of(staffRole));
        when(userRepository.findByUsername("boss")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.encode("Pass123!")).thenReturn("hashed-pw");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.createUser(request, "boss");

        verify(passwordPolicyService).validate("Pass123!");
        verify(activityLogService).log(eq(adminUser), eq("USER_CREATED"), eq("USER"), any(), anyString());
    }

    @Test
    void adminCannotDeactivateOwnAccount() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> userService.deactivateUser(1L, "boss"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("cannot");

        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAllForUser(any());
    }

    @Test
    void adminCannotChangeOwnRole() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        RoleUpdateRequest request = new RoleUpdateRequest("STAFF");

        assertThatThrownBy(() -> userService.updateRole(1L, request, "boss"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void deactivatingAnotherUserRevokesTheirActiveSessions() {
        User target = User.builder().id(5L).username("staffer").role(staffRole).status(UserStatus.ACTIVE).build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.findByUsername("boss")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refreshTokenService.revokeAllForUser(5L)).thenReturn(3);

        userService.deactivateUser(5L, "boss");

        assertThat(target.getStatus()).isEqualTo(UserStatus.INACTIVE);
        verify(refreshTokenService).revokeAllForUser(5L);
        verify(activityLogService).log(eq(adminUser), eq("USER_DEACTIVATED"), eq("USER"), eq(5L), anyString());
    }

    @Test
    void resetPasswordClearsLockoutStateAndRevokesSessions() {
        User target = User.builder().id(5L).username("staffer").role(staffRole).status(UserStatus.ACTIVE)
                .failedLoginAttempts(4).build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.findByUsername("boss")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.encode("NewPass123!")).thenReturn("new-hash");
        when(refreshTokenService.revokeAllForUser(5L)).thenReturn(1);

        AdminResetPasswordRequest request = new AdminResetPasswordRequest("NewPass123!");
        userService.resetPassword(5L, request, "boss");

        assertThat(target.getPasswordHash()).isEqualTo("new-hash");
        assertThat(target.getFailedLoginAttempts()).isZero();
        assertThat(target.getLockedUntil()).isNull();
        verify(passwordPolicyService).validate("NewPass123!");
        verify(refreshTokenService).revokeAllForUser(5L);
    }
}
