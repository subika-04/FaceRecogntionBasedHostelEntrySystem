package com.hostel.frs.service;

import com.hostel.frs.dto.FlaskMatchResponse;
import com.hostel.frs.dto.SyncCandidateDto;
import com.hostel.frs.dto.SyncEmbeddingDto;
import com.hostel.frs.dto.response.FaceFrameResponse;
import com.hostel.frs.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class FlaskAiClientService {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    public FlaskAiClientService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.flask-ai.url}") String baseUrl,
            @Value("${app.flask-ai.api-key}") String apiKey) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);
        return headers;
    }

    public FaceFrameResponse checkQuality(String base64Image) {
        String url = baseUrl + "/ai/quality/check";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("image", base64Image);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, getHeaders());
        
        try {
            log.info("Sending frame quality check request to Flask AI service.");
            ResponseEntity<FaceFrameResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, FaceFrameResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed quality check communication with Flask: {}", e.getMessage());
            throw new AiServiceException("AI service failed to evaluate frame quality: " + e.getMessage(), e);
        }
    }

    public float[] generateEmbedding(String base64Image) {
        String url = baseUrl + "/ai/embeddings/generate";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("image", base64Image);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, getHeaders());

        try {
            log.info("Requesting embedding extraction from Flask AI service.");
            ResponseEntity<FlaskEmbeddingsResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, FlaskEmbeddingsResponse.class);
            
            FlaskEmbeddingsResponse body = response.getBody();
            if (body == null || body.getEmbeddings() == null || body.getEmbeddings().isEmpty()) {
                throw new AiServiceException("AI service failed to generate embeddings: No face detected");
            }
            
            // Extract the first detected face's embedding
            return body.getEmbeddings().get(0).getEmbedding();
        } catch (Exception e) {
            log.error("Failed embedding extraction with Flask: {}", e.getMessage());
            throw new AiServiceException("AI service failed to extract facial embedding: " + e.getMessage(), e);
        }
    }

    public FlaskMatchResponse matchFace(float[] probeEmbedding) {
        String url = baseUrl + "/ai/recognition/match";
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("probeEmbedding", probeEmbedding);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, getHeaders());

        try {
            log.debug("Sending face matching request to Flask AI service.");
            ResponseEntity<FlaskMatchResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, FlaskMatchResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed face recognition matching with Flask: {}", e.getMessage());
            throw new AiServiceException("AI service failed to perform face matching: " + e.getMessage(), e);
        }
    }

    public void syncCache(List<SyncCandidateDto> candidates) {
        String url = baseUrl + "/ai/cache/sync";
        HttpEntity<List<SyncCandidateDto>> entity = new HttpEntity<>(candidates, getHeaders());

        try {
            log.info("Sending cache synchronization list ({} students) to Flask.", candidates.size());
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to synchronize embedding cache with Flask: {}", e.getMessage());
            throw new AiServiceException("AI service cache synchronization failed: " + e.getMessage(), e);
        }
    }

    public void refreshStudentCache(Long studentId, List<SyncEmbeddingDto> embeddings) {
        String url = baseUrl + "/ai/cache/refresh-student";
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("studentId", studentId);
        requestBody.put("embeddings", embeddings);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, getHeaders());

        try {
            log.info("Sending cache refresh request for student ID={}", studentId);
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to refresh cache for student ID={}: {}", studentId, e.getMessage());
            throw new AiServiceException("AI service student cache refresh failed: " + e.getMessage(), e);
        }
    }

    public void deleteStudentCache(Long studentId) {
        String url = baseUrl + "/ai/cache/student/" + studentId;
        HttpEntity<Void> entity = new HttpEntity<>(getHeaders());

        try {
            log.info("Sending cache delete request for student ID={}", studentId);
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to delete cache for student ID={}: {}", studentId, e.getMessage());
            throw new AiServiceException("AI service student cache delete failed: " + e.getMessage(), e);
        }
    }

    // Helper classes for parsing Flask JSON responses
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    private static class FlaskEmbeddingsResponse {
        private List<FaceData> embeddings;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        private static class FaceData {
            private List<Double> bbox;
            private float[] embedding;
        }
    }
}
