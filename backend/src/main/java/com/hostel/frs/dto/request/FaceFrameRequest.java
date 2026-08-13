package com.hostel.frs.dto.request;

import com.hostel.frs.entity.Pose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceFrameRequest {

    @NotNull(message = "Pose label is required")
    private Pose pose;

    @NotBlank(message = "Base64 image content is required")
    private String image; // Base64 representation of the frame
}
