package com.hostel.frs.service;

import com.hostel.frs.dto.FlaskMatchResponse;
import com.hostel.frs.dto.request.RecognitionRequest;
import com.hostel.frs.dto.response.RecognitionHistoryResponse;
import com.hostel.frs.dto.response.RecognitionResponse;
import com.hostel.frs.dto.response.StudentResponse;
import com.hostel.frs.entity.*;
import com.hostel.frs.exception.AiServiceException;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.RecognitionHistoryRepository;
import com.hostel.frs.repository.StudentRepository;
import com.hostel.frs.repository.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Slf4j
public class RecognitionService {

    // Hard floor below the admin-configurable RECOGNITION_THRESHOLD: no
    // match under 50% confidence is ever shown as a specific student, even
    // as LOW_CONFIDENCE, since a name attached to a near-coin-flip score is
    // more likely to mislead front-desk staff than a plain "not recognized"
    // would be. This is intentionally a fixed constant, not a setting --
    // RECOGNITION_THRESHOLD (default 0.60) still controls the
    // MATCHED / LOW_CONFIDENCE boundary; this only controls the
    // LOW_CONFIDENCE / UNKNOWN boundary underneath it.
    private static final double MINIMUM_DISPLAY_CONFIDENCE = 0.50;

    @Autowired
    private RecognitionHistoryRepository recognitionHistoryRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SettingsService settingsService;

    @Autowired
    private FlaskAiClientService flaskAiClientService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private MeterRegistry meterRegistry;

    @Transactional
    public RecognitionResponse identifyFace(RecognitionRequest request, String username) {
        long startTime = System.currentTimeMillis();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        String base64ImageClean = request.getImage();
        if (base64ImageClean.contains(",")) {
            base64ImageClean = base64ImageClean.split(",")[1];
        }

        Student matchedStudent = null;
        Double confidence = 0.0;
        RecognitionStatus status = RecognitionStatus.UNKNOWN;

        try {
            log.info("Starting face recognition check from camera: {}", request.getCamera());
            Timer.Sample aiCallSample = Timer.start(meterRegistry);
            // 1. Generate embedding vector from the clean base64 image
            float[] probeEmbedding = flaskAiClientService.generateEmbedding(base64ImageClean);

            // 2. Query Flask cache to find the closest match
            FlaskMatchResponse matchResponse = flaskAiClientService.matchFace(probeEmbedding);
            aiCallSample.stop(meterRegistry.timer("frhes.recognition.ai.latency"));

            if (matchResponse != null && matchResponse.getBestMatchStudentId() != null) {
                confidence = matchResponse.getConfidence();

                // Read threshold dynamically from database settings. Goes through
                // SettingsService's @Cacheable getSettingValue() rather than hitting
                // SystemSettingRepository directly, since this runs on every single
                // recognition attempt (a hot path) but the value changes only when
                // an admin edits it on the Settings screen.
                String rawThreshold = settingsService.getSettingValue("RECOGNITION_THRESHOLD");
                double threshold = 0.60;
                if (rawThreshold != null) {
                    try {
                        threshold = Double.parseDouble(rawThreshold);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid RECOGNITION_THRESHOLD format in database: {}. Defaulting to 0.60.", rawThreshold);
                    }
                }

                if (confidence < MINIMUM_DISPLAY_CONFIDENCE) {
                    // Below the hard floor: never attach a student identity,
                    // regardless of what Flask thought the closest match
                    // was -- a sub-50% score isn't reliable enough to name
                    // anyone.
                    matchedStudent = null;
                    status = RecognitionStatus.UNKNOWN;
                } else if (confidence >= threshold) {
                    matchedStudent = studentRepository.findByIdAndIsDeletedFalse(matchResponse.getBestMatchStudentId())
                            .orElse(null);
                    if (matchedStudent != null) {
                        status = RecognitionStatus.MATCHED;
                    } else {
                        log.warn("Flask returned match for student ID={}, but student record is soft-deleted or missing.", matchResponse.getBestMatchStudentId());
                        status = RecognitionStatus.UNKNOWN;
                    }
                } else {
                    // Between the 50% floor and the configured threshold:
                    // categorize as LOW_CONFIDENCE, still shown with the
                    // candidate student attached so staff can judge for
                    // themselves.
                    matchedStudent = studentRepository.findByIdAndIsDeletedFalse(matchResponse.getBestMatchStudentId())
                            .orElse(null);
                    if (matchedStudent != null) {
                        status = RecognitionStatus.LOW_CONFIDENCE;
                    } else {
                        status = RecognitionStatus.UNKNOWN;
                    }
                }
            }
        } catch (AiServiceException e) {
            log.warn("AI face recognition service returned failure: {}", e.getMessage());
            // If Flask says no face was detected, save transaction as UNKNOWN with 0.0 confidence
            if (e.getMessage() != null && e.getMessage().contains("No face detected")) {
                status = RecognitionStatus.UNKNOWN;
                confidence = 0.0;
            } else {
                // connection errors / system exceptions are bubbled up
                throw e;
            }
        } catch (Exception e) {
            log.error("Unexpected failure during recognition transaction: {}", e.getMessage(), e);
            throw e;
        }

        int durationMs = (int) (System.currentTimeMillis() - startTime);
        meterRegistry.counter("frhes.recognition.result.total", "status", status.name()).increment();

        // 3. Persist transaction history to DB
        RecognitionHistory history = RecognitionHistory.builder()
                .student(matchedStudent)
                .recognizedByCamera(request.getCamera())
                .confidenceScore(BigDecimal.valueOf(confidence).setScale(4, RoundingMode.HALF_UP))
                .status(status)
                .recognitionDurationMs(durationMs)
                .triggeredBy(user)
                .build();

        history = recognitionHistoryRepository.save(history);

        // 4. Record action in audit log
        String auditDetails = String.format("Recognition check completed. Status=%s, Confidence=%.4f, Camera=%s, Duration=%dms",
                status, confidence, request.getCamera(), durationMs);
        activityLogService.log(user, "RECOGNITION_IDENTIFY", "RECOGNITION", history.getId(), auditDetails);

        return RecognitionResponse.builder()
                .status(status.name())
                .student(mapToStudentResponse(matchedStudent))
                .confidence(confidence)
                .recognitionDurationMs(durationMs)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<RecognitionHistoryResponse> getHistory(
            String username,
            Long studentId,
            RecognitionStatus status,
            String camera,
            Long triggeredById,
            Pageable pageable) {

        User requestingUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        // Enforce user role security constraints
        if ("STAFF".equals(requestingUser.getRole().getName())) {
            // Staff members can only search and view history they triggered
            triggeredById = requestingUser.getId();
        }

        return recognitionHistoryRepository.searchHistory(triggeredById, studentId, status, camera, pageable)
                .map(this::mapToHistoryResponse);
    }

    @Transactional(readOnly = true)
    public RecognitionHistoryResponse getHistoryById(Long id, String username) {
        RecognitionHistory history = recognitionHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recognition history record not found with ID: " + id));

        User requestingUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        // Enforce user role security constraints
        if ("STAFF".equals(requestingUser.getRole().getName()) &&
                !history.getTriggeredBy().getId().equals(requestingUser.getId())) {
            throw new UnauthorizedException("Access Denied: You do not have permission to view recognition records triggered by another user.");
        }

        return mapToHistoryResponse(history);
    }

    private StudentResponse mapToStudentResponse(Student student) {
        if (student == null) {
            return null;
        }
        return StudentResponse.builder()
                .id(student.getId())
                .registerNumber(student.getRegisterNumber())
                .fullName(student.getFullName())
                .department(student.getDepartment())
                .year(student.getYear())
                .hostelStatus(student.getHostelStatus().name())
                .phone(student.getPhone())
                .email(student.getEmail())
                .profileImageUrl(student.getProfileImageUrl())
                .enrollmentStatus(student.getEnrollmentStatus().name())
                .registeredByUsername(student.getRegisteredBy().getUsername())
                .createdAt(student.getCreatedAt())
                .build();
    }

    private RecognitionHistoryResponse mapToHistoryResponse(RecognitionHistory history) {
        return RecognitionHistoryResponse.builder()
                .id(history.getId())
                .student(mapToStudentResponse(history.getStudent()))
                .recognizedByCamera(history.getRecognizedByCamera())
                .confidenceScore(history.getConfidenceScore() != null ? history.getConfidenceScore().doubleValue() : null)
                .status(history.getStatus().name())
                .recognitionDurationMs(history.getRecognitionDurationMs())
                .recognizedAt(history.getRecognizedAt())
                .triggeredByUsername(history.getTriggeredBy().getUsername())
                .build();
    }
}
