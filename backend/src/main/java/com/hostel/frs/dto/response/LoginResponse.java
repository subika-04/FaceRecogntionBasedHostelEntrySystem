package com.hostel.frs.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String accessToken;
    private long expiresIn; // in seconds, typically 900 (15 min)
    private UserResponse user;
    
    @JsonIgnore
    private String refreshToken;
}
