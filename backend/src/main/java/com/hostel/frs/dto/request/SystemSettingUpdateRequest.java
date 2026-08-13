package com.hostel.frs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingUpdateRequest {

    @NotBlank(message = "Setting value cannot be blank")
    private String value;
}
