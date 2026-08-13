package com.hostel.frs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionRequest {

    @NotBlank(message = "Camera identifier is required")
    private String camera;

    @NotBlank(message = "Base64 image string is required")
    private String image; // Base64 image
}
