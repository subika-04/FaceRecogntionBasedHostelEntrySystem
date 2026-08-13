package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraCountResponse {
    private String camera;
    private long count;
}
