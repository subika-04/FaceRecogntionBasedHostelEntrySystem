package com.hostel.frs.controller;

import com.hostel.frs.dto.request.SystemSettingUpdateRequest;
import com.hostel.frs.dto.response.SystemSettingResponse;
import com.hostel.frs.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/settings")
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    @GetMapping
    public ResponseEntity<List<SystemSettingResponse>> getAllSettings() {
        List<SystemSettingResponse> response = settingsService.getAllSettings();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemSettingResponse> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        SystemSettingResponse response = settingsService.updateSetting(key, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
