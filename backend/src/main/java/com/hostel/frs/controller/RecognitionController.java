package com.hostel.frs.controller;

import com.hostel.frs.dto.request.RecognitionRequest;
import com.hostel.frs.dto.response.RecognitionHistoryResponse;
import com.hostel.frs.dto.response.RecognitionResponse;
import com.hostel.frs.entity.RecognitionStatus;
import com.hostel.frs.service.RecognitionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/recognition")
public class RecognitionController {

    @Autowired
    private RecognitionService recognitionService;

    @Value("${app.upload.recognition-dir}")
    private String recognitionUploadDir;

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

    // Serves a captured frame from an UNKNOWN recognition attempt (see
    // RecognitionService.saveUnrecognizedFaceImage). Same auth model and
    // path-traversal defenses as StudentController.getStudentImage:
    //   1. filename must match exactly the pattern this app itself writes
    //      (unrecognized_<uuid>.jpg), which alone rules out traversal
    //      segments and any other extension.
    //   2. resolve + normalize, then re-verify the result is still inside
    //      recognitionUploadDir before touching the filesystem.
    // ?download=true adds a Content-Disposition: attachment header so the
    // browser saves the file directly instead of navigating to it, for the
    // "download this person's photo" action on the frontend.
    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<byte[]> getCapturedFaceImage(
            @PathVariable String filename,
            @RequestParam(defaultValue = "false") boolean download) throws IOException {

        if (!filename.matches("unrecognized_[a-fA-F0-9\\-]{36}\\.jpg")) {
            return ResponseEntity.badRequest().build();
        }

        Path uploadRoot = Paths.get(recognitionUploadDir).toAbsolutePath().normalize();
        Path imagePath = uploadRoot.resolve(filename).normalize();

        if (!imagePath.startsWith(uploadRoot) || !Files.exists(imagePath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] imageBytes = Files.readAllBytes(imagePath);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG);

        if (download) {
            responseBuilder.header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename(filename).build().toString());
        }

        return responseBuilder.body(imageBytes);
    }
}
