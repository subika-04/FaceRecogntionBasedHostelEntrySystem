package com.hostel.frs.controller;

import com.hostel.frs.dto.response.*;
import com.hostel.frs.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        DashboardSummaryResponse response = analyticsService.getSummary();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendDataPoint>> getTrends(
            @RequestParam(value = "range", defaultValue = "DAILY") String range) {
        
        List<TrendDataPoint> response = analyticsService.getTrends(range);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/peak-hours")
    public ResponseEntity<List<PeakHourResponse>> getPeakEntryHours() {
        List<PeakHourResponse> response = analyticsService.getPeakEntryHours();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cameras")
    public ResponseEntity<List<CameraCountResponse>> getTopCameras(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        
        List<CameraCountResponse> response = analyticsService.getTopCameras(limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent/successful")
    public ResponseEntity<List<RecognitionHistoryResponse>> getRecentSuccessful(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        
        List<RecognitionHistoryResponse> response = analyticsService.getRecentSuccessful(limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent/activity")
    public ResponseEntity<List<RecognitionHistoryResponse>> getRecentActivity(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        
        List<RecognitionHistoryResponse> response = analyticsService.getRecentActivity(limit);
        return ResponseEntity.ok(response);
    }
}
