package com.hostel.frs.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncCandidateDto {
    private Long studentId;
    private List<SyncEmbeddingDto> embeddings;
}
