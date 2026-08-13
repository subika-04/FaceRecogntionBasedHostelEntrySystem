package com.hostel.frs.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncEmbeddingDto {
    private String pose;
    private float[] vector;
}
