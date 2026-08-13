package com.hostel.frs.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username may only contain letters, digits, dots, underscores, and hyphens")
    private String username;

    @NotBlank(message = "Password is required")
    private String password; // strength enforced dynamically by PasswordPolicyService, not a fixed annotation

    @Size(max = 20)
    private String phone;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "(?i)ADMIN|STAFF", message = "Role must be either ADMIN or STAFF")
    private String role;

    private String avatarUrl;
}
