package com.hostel.frs.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlaskMatchResponse {
    private Long bestMatchStudentId;
    private double confidence;
}
