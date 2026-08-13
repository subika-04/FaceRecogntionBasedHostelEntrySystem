package com.hostel.frs.service;

import com.hostel.frs.dto.request.AdminResetPasswordRequest;
import com.hostel.frs.dto.request.RoleUpdateRequest;
import com.hostel.frs.dto.request.UserCreateRequest;
import com.hostel.frs.dto.request.UserUpdateRequest;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.entity.Role;
import com.hostel.frs.entity.User;
import com.hostel.frs.entity.UserStatus;
import com.hostel.frs.exception.DuplicateResourceException;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.RoleRepository;
import com.hostel.frs.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.hostel.frs.config.CacheConfig.USERS_CACHE;

/**
 * Enterprise user-management module (previously entirely absent -- the only
 * way to create an account was a manual SQL INSERT; see the audit report's
 * Phase 2/10 findings). ADMIN-only end to end: enforced at the URL level in
 * SecurityConfig (`/users/**` -> hasRole("ADMIN")) and again at the method
 * level here / in UserController via `@PreAuthorize` for defense in depth,
 * matching the pattern already used by StudentController/SettingsController.
 */
@Service
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordPolicyService passwordPolicyService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserMapper userMapper;

    @Transactional
    public UserResponse createUser(UserCreateRequest request, String createdByUsername) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered.");
        }

        passwordPolicyService.validate(request.getPassword());

        Role role = roleRepository.findByNameIgnoreCase(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        User creator = userRepository.findByUsername(createdByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Creating admin user not found: " + createdByUsername));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .status(UserStatus.ACTIVE)
                .avatarUrl(request.getAvatarUrl())
                .createdBy(creator)
                .build();

        user = userRepository.save(user);

        activityLogService.log(creator, "USER_CREATED", "USER", user.getId(),
                String.format("Created %s account '%s' (%s)", role.getName(), user.getUsername(), user.getEmail()));

        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, String role, String status, Pageable pageable) {
        UserStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = UserStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status filter: " + status + " (expected ACTIVE or INACTIVE)");
            }
        }
        String roleFilter = (role != null && !role.isBlank()) ? role.trim().toUpperCase() : null;
        String queryFilter = (query != null && !query.isBlank()) ? query.trim() : null;

        return userRepository.searchUsers(queryFilter, roleFilter, statusEnum, pageable)
                .map(userMapper::toResponse);
    }

    @Cacheable(value = USERS_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return userMapper.toResponse(user);
    }

    @CacheEvict(value = USERS_CACHE, key = "#id")
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request, String updatedByUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered to another account.");
        }

        User admin = userRepository.findByUsername(updatedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + updatedByUsername));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        user = userRepository.save(user);

        activityLogService.log(admin, "USER_UPDATED", "USER", user.getId(),
                "Profile updated for user '" + user.getUsername() + "'");

        return userMapper.toResponse(user);
    }

    @CacheEvict(value = USERS_CACHE, key = "#id")
    @Transactional
    public UserResponse updateRole(Long id, RoleUpdateRequest request, String updatedByUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        preventSelfTarget(user, updatedByUsername, "change your own role");

        Role newRole = roleRepository.findByNameIgnoreCase(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        User admin = userRepository.findByUsername(updatedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + updatedByUsername));

        String oldRole = user.getRole().getName();
        user.setRole(newRole);
        user = userRepository.save(user);

        // A role change is security-sensitive enough to warrant forcing
        // re-authentication with a fresh JWT carrying the new role claim,
        // rather than letting an already-issued access token with the old
        // role claim keep working for up to 15 more minutes.
        int revoked = refreshTokenService.revokeAllForUser(user.getId());

        activityLogService.log(admin, "USER_ROLE_CHANGED", "USER", user.getId(),
                String.format("Role changed from %s to %s for user '%s'; %d active session(s) revoked",
                        oldRole, newRole.getName(), user.getUsername(), revoked));

        return userMapper.toResponse(user);
    }

    @CacheEvict(value = USERS_CACHE, key = "#id")
    @Transactional
    public UserResponse deactivateUser(Long id, String deactivatedByUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        preventSelfTarget(user, deactivatedByUsername, "deactivate your own account");

        User admin = userRepository.findByUsername(deactivatedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + deactivatedByUsername));

        user.setStatus(UserStatus.INACTIVE);
        user = userRepository.save(user);

        // Deactivating an account should immediately end any session it's
        // currently using, not just block future logins.
        int revoked = refreshTokenService.revokeAllForUser(user.getId());

        activityLogService.log(admin, "USER_DEACTIVATED", "USER", user.getId(),
                String.format("Deactivated user '%s'; %d active session(s) revoked", user.getUsername(), revoked));

        return userMapper.toResponse(user);
    }

    @CacheEvict(value = USERS_CACHE, key = "#id")
    @Transactional
    public UserResponse activateUser(Long id, String activatedByUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        User admin = userRepository.findByUsername(activatedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + activatedByUsername));

        user.setStatus(UserStatus.ACTIVE);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null); // reactivating also clears any stale brute-force lock
        user = userRepository.save(user);

        activityLogService.log(admin, "USER_ACTIVATED", "USER", user.getId(), "Activated user '" + user.getUsername() + "'");

        return userMapper.toResponse(user);
    }

    @CacheEvict(value = USERS_CACHE, key = "#id")
    @Transactional
    public void resetPassword(Long id, AdminResetPasswordRequest request, String resetByUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        User admin = userRepository.findByUsername(resetByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + resetByUsername));

        passwordPolicyService.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        int revoked = refreshTokenService.revokeAllForUser(user.getId());

        activityLogService.log(admin, "USER_PASSWORD_RESET", "USER", user.getId(),
                String.format("Password reset by admin for user '%s'; %d active session(s) revoked", user.getUsername(), revoked));
    }

    private void preventSelfTarget(User targetUser, String currentAdminUsername, String action) {
        if (targetUser.getUsername().equalsIgnoreCase(currentAdminUsername)) {
            throw new UnauthorizedException("You cannot " + action + ". Ask another administrator to do this.");
        }
    }
}
