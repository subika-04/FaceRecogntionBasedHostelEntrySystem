package com.hostel.frs.service;

import com.hostel.frs.dto.request.ProfileUpdateRequest;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.entity.User;
import com.hostel.frs.exception.DuplicateResourceException;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogService auditLogService;

    @Transactional(readOnly = true)
    public UserResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Validate email uniqueness if changing email
        if (!user.getEmail().equalsIgnoreCase(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email already in use: " + request.getEmail());
            }
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAvatarUrl(request.getAvatarUrl());
        
        userRepository.save(user);

        auditLogService.log(user, "PROFILE_UPDATED", "USER", user.getId(), "User updated profile details");

        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .status(user.getStatus().name())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
