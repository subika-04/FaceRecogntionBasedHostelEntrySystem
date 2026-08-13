package com.hostel.frs.service;

import com.hostel.frs.dto.response.*;
import com.hostel.frs.entity.EnrollmentStatus;
import com.hostel.frs.entity.RecognitionStatus;
import com.hostel.frs.repository.RecognitionHistoryRepository;
import com.hostel.frs.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AnalyticsService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RecognitionHistoryRepository recognitionHistoryRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        log.info("Analytics Service: Computing dashboard metrics summary...");

        long totalRegistered = studentRepository.countByIsDeletedFalse();
        long active = studentRepository.countByEnrollmentStatusAndIsDeletedFalse(EnrollmentStatus.ENROLLED);
        // Inactive students are registered but not fully ENROLLED (either PENDING or FAILED)
        long inactive = totalRegistered - active;

        long totalAttempts = recognitionHistoryRepository.count();
        long successfulMatches = recognitionHistoryRepository.countByStatus(RecognitionStatus.MATCHED);
        long unknownFaces = recognitionHistoryRepository.countByStatus(RecognitionStatus.UNKNOWN);
        long lowConfidence = recognitionHistoryRepository.countByStatus(RecognitionStatus.LOW_CONFIDENCE);

        double successRate = 0.0;
        if (totalAttempts > 0) {
            successRate = ((double) successfulMatches / totalAttempts) * 100.0;
            // Round to 2 decimal places
            successRate = Math.round(successRate * 100.0) / 100.0;
        }

        return DashboardSummaryResponse.builder()
                .totalRegisteredStudents(totalRegistered)
                .activeStudents(active)
                .inactiveStudents(inactive)
                .totalAttempts(totalAttempts)
                .successfulMatches(successfulMatches)
                .unknownFaces(unknownFaces)
                .lowConfidence(lowConfidence)
                .successRate(successRate)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TrendDataPoint> getTrends(String rangeType) {
        log.info("Analytics Service: Fetching trend data for range '{}'...", rangeType);
        
        LocalDateTime startDate;
        List<RecognitionHistoryRepository.TrendProjection> projections;

        if ("WEEKLY".equalsIgnoreCase(rangeType)) {
            // Last 12 weeks
            startDate = LocalDateTime.now().minusWeeks(12);
            projections = recognitionHistoryRepository.getWeeklyTrends(startDate);
        } else if ("MONTHLY".equalsIgnoreCase(rangeType)) {
            // Last 12 months
            startDate = LocalDateTime.now().minusMonths(12);
            projections = recognitionHistoryRepository.getMonthlyTrends(startDate);
        } else if ("DAILY".equalsIgnoreCase(rangeType) || rangeType == null) {
            // Default/Daily: Last 30 days
            startDate = LocalDateTime.now().minusDays(30);
            projections = recognitionHistoryRepository.getDailyTrends(startDate);
        } else {
            throw new IllegalArgumentException("Invalid range type. Supported values are: DAILY, WEEKLY, MONTHLY");
        }

        return projections.stream()
                .map(p -> new TrendDataPoint(p.getLabel(), p.getCount() != null ? p.getCount() : 0L))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PeakHourResponse> getPeakEntryHours() {
        log.info("Analytics Service: Fetching peak entry hours...");
        
        List<RecognitionHistoryRepository.PeakHourProjection> projections = 
                recognitionHistoryRepository.getPeakHours();

        // Ensure all 24 hours are represented, defaulting missing hours to 0
        long[] hourCounts = new long[24];
        for (RecognitionHistoryRepository.PeakHourProjection p : projections) {
            if (p.getHour() != null && p.getHour() >= 0 && p.getHour() < 24) {
                hourCounts[p.getHour()] = p.getCount() != null ? p.getCount() : 0L;
            }
        }

        List<PeakHourResponse> response = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            response.add(new PeakHourResponse(h, hourCounts[h]));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<CameraCountResponse> getTopCameras(int limit) {
        // Enforce limit cap (minimum 1, maximum 100)
        int finalLimit = Math.min(Math.max(1, limit), 100);
        log.info("Analytics Service: Fetching top {} cameras...", finalLimit);

        return recognitionHistoryRepository.getTopCameras(finalLimit).stream()
                .map(p -> new CameraCountResponse(
                        p.getCamera() != null ? p.getCamera() : "UNKNOWN",
                        p.getCount() != null ? p.getCount() : 0L
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecognitionHistoryResponse> getRecentSuccessful(int limit) {
        int finalLimit = Math.min(Math.max(1, limit), 100);
        log.info("Analytics Service: Fetching recent successful matches capped at {}...", finalLimit);
        
        Pageable pageable = PageRequest.of(0, finalLimit);
        return recognitionHistoryRepository.findRecentSuccessful(pageable).stream()
                .map(this::mapProjectionToHistoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecognitionHistoryResponse> getRecentActivity(int limit) {
        int finalLimit = Math.min(Math.max(1, limit), 100);
        log.info("Analytics Service: Fetching recent activity attempts capped at {}...", finalLimit);

        Pageable pageable = PageRequest.of(0, finalLimit);
        return recognitionHistoryRepository.findRecentActivity(pageable).stream()
                .map(this::mapProjectionToHistoryResponse)
                .collect(Collectors.toList());
    }

    private RecognitionHistoryResponse mapProjectionToHistoryResponse(
            RecognitionHistoryRepository.RecognitionHistoryProjection p) {
        
        StudentResponse student = null;
        if (p.getStudentId() != null) {
            student = StudentResponse.builder()
                    .id(p.getStudentId())
                    .registerNumber(p.getStudentRegisterNumber())
                    .fullName(p.getStudentFullName())
                    .department(p.getStudentDepartment())
                    .year(p.getStudentYear())
                    .hostelStatus(p.getStudentHostelStatus())
                    .phone(p.getStudentPhone())
                    .email(p.getStudentEmail())
                    .profileImageUrl(p.getStudentProfileImageUrl())
                    .enrollmentStatus(p.getStudentEnrollmentStatus())
                    .registeredByUsername(p.getStudentRegisteredByUsername())
                    .createdAt(p.getStudentCreatedAt())
                    .build();
        }

        return RecognitionHistoryResponse.builder()
                .id(p.getId())
                .student(student)
                .recognizedByCamera(p.getRecognizedByCamera())
                .confidenceScore(p.getConfidenceScore() != null ? p.getConfidenceScore().doubleValue() : null)
                .status(p.getStatus())
                .recognitionDurationMs(p.getRecognitionDurationMs())
                .recognizedAt(p.getRecognizedAt())
                .triggeredByUsername(p.getTriggeredByUsername())
                .build();
    }
}
