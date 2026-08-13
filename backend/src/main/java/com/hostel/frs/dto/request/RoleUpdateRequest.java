package com.hostel.frs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpdateRequest {

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "(?i)ADMIN|STAFF", message = "Role must be either ADMIN or STAFF")
    private String role;
}
