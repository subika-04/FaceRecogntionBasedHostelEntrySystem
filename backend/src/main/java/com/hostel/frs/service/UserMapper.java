package com.hostel.frs.service;

import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Single place that converts a User entity to the DTO the frontend receives.
 * Previously this exact builder call was written out inline both in
 * AuthService.authenticate() and (about to be) in UserService -- any future
 * field addition would have needed to be added in two places and would
 * silently drift if someone updated only one.
 */
@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        boolean locked = user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now());
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .status(user.getStatus().name())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .locked(locked)
                .build();
    }
}
