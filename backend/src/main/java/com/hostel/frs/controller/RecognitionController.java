package com.hostel.frs.controller;

import com.hostel.frs.dto.request.RecognitionRequest;
import com.hostel.frs.dto.response.RecognitionHistoryResponse;
import com.hostel.frs.dto.response.RecognitionResponse;
import com.hostel.frs.entity.RecognitionStatus;
import com.hostel.frs.service.RecognitionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recognition")
public class RecognitionController {

    @Autowired
    private RecognitionService recognitionService;

    @PostMapping("/identify")
    public ResponseEntity<RecognitionResponse> identifyFace(
            @Valid @RequestBody RecognitionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        RecognitionResponse response = recognitionService.identifyFace(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<RecognitionHistoryResponse>> getHistory(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) RecognitionStatus status,
            @RequestParam(required = false) String camera,
            @RequestParam(required = false) Long triggeredById,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "recognizedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<RecognitionHistoryResponse> response = recognitionService.getHistory(
                userDetails.getUsername(),
                studentId,
                status,
                camera,
                triggeredById,
                pageable
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<RecognitionHistoryResponse> getHistoryById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        RecognitionHistoryResponse response = recognitionService.getHistoryById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
