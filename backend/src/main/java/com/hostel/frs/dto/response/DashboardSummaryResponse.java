package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private long totalRegisteredStudents;
    private long activeStudents;    // Enrolled
    private long inactiveStudents;  // Pending or Failed
    private long totalAttempts;
    private long successfulMatches; // MATCHED
    private long unknownFaces;      // UNKNOWN
    private long lowConfidence;     // LOW_CONFIDENCE
    private double successRate;     // successfulMatches / totalAttempts (0.0 to 100.0)
}
