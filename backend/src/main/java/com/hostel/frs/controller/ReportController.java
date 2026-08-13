package com.hostel.frs.controller;

import com.hostel.frs.entity.EnrollmentStatus;
import com.hostel.frs.entity.RecognitionStatus;
import com.hostel.frs.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    @Autowired
    private ReportService reportService;

    private static final DateTimeFormatter FILENAME_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @GetMapping("/recognition-history")
    public ResponseEntity<StreamingResponseBody> getRecognitionHistoryReport(
            @RequestParam(value = "studentId", required = false) Long studentId,
            @RequestParam(value = "status", required = false) RecognitionStatus status,
            @RequestParam(value = "camera", required = false) String camera,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        validateDateRange(startDate, endDate);
        
        String filename = "recognition-history-report-" + LocalDateTime.now().format(FILENAME_DATE_FORMATTER) + ".csv";
        StreamingResponseBody responseBody = reportService.exportRecognitionHistory(studentId, status, camera, startDate, endDate);
        
        return buildStreamingResponse(responseBody, filename);
    }

    @GetMapping("/students")
    public ResponseEntity<StreamingResponseBody> getStudentsReport(
            @RequestParam(value = "status", required = false) EnrollmentStatus status,
            @RequestParam(value = "query", required = false) String query) {
        
        String filename = "student-directory-report-" + LocalDateTime.now().format(FILENAME_DATE_FORMATTER) + ".csv";
        StreamingResponseBody responseBody = reportService.exportStudents(status, query);
        
        return buildStreamingResponse(responseBody, filename);
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<StreamingResponseBody> getActivityLogsReport(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        validateDateRange(startDate, endDate);
        
        String filename = "activity-logs-report-" + LocalDateTime.now().format(FILENAME_DATE_FORMATTER) + ".csv";
        StreamingResponseBody responseBody = reportService.exportActivityLogs(userId, action, startDate, endDate);
        
        return buildStreamingResponse(responseBody, filename);
    }

    private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }
    }

    private ResponseEntity<StreamingResponseBody> buildStreamingResponse(StreamingResponseBody responseBody, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(responseBody);
    }
}
