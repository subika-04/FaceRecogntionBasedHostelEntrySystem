package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeakHourResponse {
    private int hour; // 0 to 23
    private long count;
}
