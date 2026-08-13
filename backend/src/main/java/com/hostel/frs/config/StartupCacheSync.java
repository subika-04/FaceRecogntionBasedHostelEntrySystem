package com.hostel.frs.config;

import com.hostel.frs.dto.SyncCandidateDto;
import com.hostel.frs.dto.SyncEmbeddingDto;
import com.hostel.frs.entity.FaceEmbedding;
import com.hostel.frs.repository.FaceEmbeddingRepository;
import com.hostel.frs.service.FlaskAiClientService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class StartupCacheSync implements ApplicationListener<ApplicationReadyEvent> {

    @Autowired
    private FaceEmbeddingRepository faceEmbeddingRepository;

    @Autowired
    private FlaskAiClientService flaskAiClientService;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("FRHES Startup: Application started. Seeding Flask RAM Cache with MySQL face embeddings.");
        
        try {
            List<FaceEmbedding> allEmbeddings = faceEmbeddingRepository.findAllActiveEmbeddings();
            
            // Group the flat list of embeddings by their student identifier
            Map<Long, List<FaceEmbedding>> groupedEmbeddings = allEmbeddings.stream()
                    .collect(Collectors.groupingBy(fe -> fe.getStudent().getId()));

            List<SyncCandidateDto> candidates = new ArrayList<>();
            for (Map.Entry<Long, List<FaceEmbedding>> entry : groupedEmbeddings.entrySet()) {
                List<SyncEmbeddingDto> poseEmbeddings = entry.getValue().stream()
                        .map(fe -> SyncEmbeddingDto.builder()
                                .pose(fe.getPose().name())
                                .vector(fe.getEmbeddingVector())
                                .build())
                        .collect(Collectors.toList());

                candidates.add(SyncCandidateDto.builder()
                        .studentId(entry.getKey())
                        .embeddings(poseEmbeddings)
                        .build());
            }

            log.info("Sending {} student profiles (total embeddings: {}) to Flask AI Cache.", 
                    candidates.size(), allEmbeddings.size());
            
            flaskAiClientService.syncCache(candidates);
            log.info("FRHES Startup: Successfully synchronized Flask RAM cache.");
            
        } catch (Exception e) {
            log.error("FRHES Startup ERROR: Could not sync embeddings with Flask AI service. " +
                    "Make sure the Flask service is running and accessible. Error: {}", e.getMessage());
        }
    }
}
