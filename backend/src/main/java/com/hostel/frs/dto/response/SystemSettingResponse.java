package com.hostel.frs.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingResponse {
    private String key;
    private String value;
    private String updatedByUsername;
    private LocalDateTime updatedAt;
}
