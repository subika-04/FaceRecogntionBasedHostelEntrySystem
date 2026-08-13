package com.hostel.frs.controller;

import com.hostel.frs.dto.request.AdminResetPasswordRequest;
import com.hostel.frs.dto.request.RoleUpdateRequest;
import com.hostel.frs.dto.request.UserCreateRequest;
import com.hostel.frs.dto.request.UserUpdateRequest;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Enterprise user-management module. ADMIN-only end to end:
 *  - SecurityConfig maps `/users/**` to `hasRole("ADMIN")` at the URL level.
 *  - `@PreAuthorize` here repeats the check at the method level (defense in
 *    depth, and self-documenting for anyone reading just this file).
 *
 * Pagination/search/sort follow the exact same query-parameter convention
 * StudentController already established (`query`, `page`, `size`, `sortBy`,
 * `sortDir`), so the frontend can reuse one pagination component for both
 * screens instead of learning two different conventions.
 */
@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.createUser(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserResponse> response = userService.searchUsers(query, role, status, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.updateUser(id, request, userDetails.getUsername()));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.updateRole(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.deactivateUser(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.activateUser(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminResetPasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.resetPassword(id, request, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. All active sessions for this user have been signed out."));
    }
}
