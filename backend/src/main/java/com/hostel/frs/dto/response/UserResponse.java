package com.hostel.frs.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String username;
    private String phone;
    private String role;
    private String status;
    private String avatarUrl;
    // Added for the User Management screen; omitted (null) is harmless for
    // older callers (e.g. LoginResponse) that don't set them.
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private Boolean locked;
}
