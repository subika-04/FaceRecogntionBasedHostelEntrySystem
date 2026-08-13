package com.hostel.frs.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionHistoryResponse {
    private Long id;
    private StudentResponse student; // Null if unknown
    private String recognizedByCamera;
    private Double confidenceScore;
    private String status;
    private Integer recognitionDurationMs;
    private LocalDateTime recognizedAt;
    private String triggeredByUsername;
}
