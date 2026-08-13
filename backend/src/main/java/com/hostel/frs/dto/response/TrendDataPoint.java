package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrendDataPoint {
    private String label; // e.g., "2026-07-01", "2026-W26", "2026-07"
    private long count;
}
