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
    // Set only when status is UNKNOWN and the captured frame was persisted,
    // so the live capture screen can show the actual face immediately
    // instead of a blank placeholder.
    private String capturedImageUrl;
}
