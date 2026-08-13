package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionResponse {
    private String status;
    private StudentResponse student; // Null if unknown
    private Double confidence;
    private Integer recognitionDurationMs;
}
