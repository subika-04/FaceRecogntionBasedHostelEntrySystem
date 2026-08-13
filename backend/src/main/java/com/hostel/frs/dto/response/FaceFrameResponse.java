package com.hostel.frs.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceFrameResponse {
    
    private boolean accepted;
    private String reason;
    private QualityDetails quality;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QualityDetails {
        private boolean faceDetected;
        private boolean singleFace;
        private double sharpness;
        private String lighting;
        private boolean centered;
    }
}
