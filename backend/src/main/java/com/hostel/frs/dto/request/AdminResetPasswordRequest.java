package com.hostel.frs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Distinct from ChangePasswordRequest: an admin resetting someone else's
 * password does not know (and should not need) that user's current
 * password, so there is no oldPassword field here.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminResetPasswordRequest {

    @NotBlank(message = "New password is required")
    private String newPassword;
}
