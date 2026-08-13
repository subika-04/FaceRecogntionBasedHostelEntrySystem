package com.hostel.frs.controller;

import com.hostel.frs.dto.request.FaceFrameRequest;
import com.hostel.frs.dto.request.StudentCreateRequest;
import com.hostel.frs.dto.response.FaceFrameResponse;
import com.hostel.frs.dto.response.StudentResponse;
import com.hostel.frs.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(
            @Valid @RequestBody StudentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentResponse response = studentService.createStudent(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<StudentResponse>> searchStudents(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<StudentResponse> response = studentService.searchStudents(query, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        StudentResponse response = studentService.getStudentById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentResponse response = studentService.updateStudent(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        studentService.deleteStudent(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enrollment/frame")
    public ResponseEntity<FaceFrameResponse> uploadEnrollmentFrame(
            @PathVariable Long id,
            @Valid @RequestBody FaceFrameRequest request) {
        FaceFrameResponse response = studentService.processEnrollmentFrame(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/enrollment/complete")
    public ResponseEntity<StudentResponse> completeEnrollment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentResponse response = studentService.completeEnrollment(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<byte[]> getStudentImage(@PathVariable String filename) throws IOException {
        // SECURITY: `filename` comes straight from the URL. Without this check, a
        // request like GET /students/images/..%2f..%2fapplication.yml could escape
        // `uploadDir` via path traversal and read arbitrary files the app process
        // can access. Two independent defenses are applied:
        //   1. Only accept names matching exactly the pattern this app itself ever
        //      writes (student_<id>.jpg) — this alone rules out traversal segments,
        //      absolute paths, and any other extension.
        //   2. Belt-and-braces: resolve + normalize the path and re-verify the
        //      result is still inside uploadDir before touching the filesystem.
        if (!filename.matches("student_\\d+\\.jpg")) {
            return ResponseEntity.badRequest().build();
        }

        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path imagePath = uploadRoot.resolve(filename).normalize();

        if (!imagePath.startsWith(uploadRoot) || !Files.exists(imagePath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] imageBytes = Files.readAllBytes(imagePath);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageBytes);
    }
}
