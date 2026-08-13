package com.hostel.frs.service;

import com.hostel.frs.dto.request.SystemSettingUpdateRequest;
import com.hostel.frs.dto.response.SystemSettingResponse;
import com.hostel.frs.entity.SystemSetting;
import com.hostel.frs.entity.User;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.repository.SystemSettingRepository;
import com.hostel.frs.repository.UserRepository;
import com.hostel.frs.validation.GenericSettingValidator;
import com.hostel.frs.validation.SettingValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static com.hostel.frs.config.CacheConfig.SETTINGS_CACHE;

@Service
@Slf4j
public class SettingsService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private List<SettingValidator> validators;

    @Autowired
    private GenericSettingValidator genericValidator;

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return systemSettingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Read path for every setting lookup, including the hot recognition path
     * ({@code RecognitionService} reads RECOGNITION_THRESHOLD on every
     * identification attempt). {@code @Cacheable} replaces a hand-rolled
     * {@code ConcurrentHashMap} + {@code @PostConstruct} warm-up that used to
     * live here -- functionally equivalent, but declarative, automatically
     * thread-safe, and consistent with the caching approach used elsewhere
     * in the codebase now (see {@code app.config.cache.type: simple} in
     * application.yml) rather than a second, bespoke caching mechanism.
     */
    @Cacheable(value = SETTINGS_CACHE, key = "#key", unless = "#result == null")
    @Transactional(readOnly = true)
    public String getSettingValue(String key) {
        return systemSettingRepository.findByKey(key)
                .map(SystemSetting::getValue)
                .orElse(null);
    }

    @Transactional
    @CacheEvict(value = SETTINGS_CACHE, key = "#key")
    public SystemSettingResponse updateSetting(String key, SystemSettingUpdateRequest request, String adminUsername) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUsername));

        SystemSetting setting = systemSettingRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting key not found: " + key));

        String newValue = request.getValue();
        String oldValue = setting.getValue();

        // Centralized Validation Dispatcher using Strategy Pattern
        SettingValidator validator = validators.stream()
                .filter(v -> !(v instanceof GenericSettingValidator) && v.supports(key))
                .findFirst()
                .orElse(genericValidator);

        log.info("System Settings: Validating key '{}' using validator: {}", key, validator.getClass().getSimpleName());
        validator.validate(newValue);

        // Update database (source of truth). The @CacheEvict above removes the
        // stale cached value for this key so the next getSettingValue() call
        // repopulates it from this fresh row -- no manual cache.put needed.
        setting.setValue(newValue);
        setting.setUpdatedBy(admin);
        setting.setUpdatedAt(LocalDateTime.now());
        setting = systemSettingRepository.save(setting);

        // Generate Audit Log
        String auditDetails = String.format(
                "System setting updated: settingKey=%s, oldValue=%s, newValue=%s, updatedBy=%s, timestamp=%s",
                key, oldValue, newValue, admin.getUsername(), LocalDateTime.now());
        activityLogService.log(admin, "SETTING_UPDATE", "SETTING", setting.getId(), auditDetails);

        return mapToResponse(setting);
    }

    private SystemSettingResponse mapToResponse(SystemSetting setting) {
        return SystemSettingResponse.builder()
                .key(setting.getKey())
                .value(setting.getValue())
                .updatedByUsername(setting.getUpdatedBy() != null ? setting.getUpdatedBy().getUsername() : "SYSTEM")
                .updatedAt(setting.getUpdatedAt() != null ? setting.getUpdatedAt() : LocalDateTime.now())
                .build();
    }
}
