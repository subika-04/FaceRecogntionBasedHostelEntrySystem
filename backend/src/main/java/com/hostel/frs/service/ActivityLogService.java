package com.hostel.frs.service;

import com.hostel.frs.entity.ActivityLog;
import com.hostel.frs.entity.User;
import com.hostel.frs.repository.ActivityLogRepository;
import com.hostel.frs.repository.UserRepository;
import com.hostel.frs.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@Slf4j
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private HttpServletRequest httpServletRequest;

    @Transactional
    public void log(String username, String action, String entityType, Long entityId, String details) {
        userRepository.findByUsername(username).ifPresent(user -> log(user, action, entityType, entityId, details));
    }

    @Transactional
    public void log(User user, String action, String entityType, Long entityId, String details) {
        String ipAddress = "N/A";
        String userAgent = "N/A";

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : httpServletRequest;
            if (request != null) {
                ipAddress = ClientIpResolver.resolve(request);
                userAgent = request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.warn("Failed to extract IP address or User-Agent for audit log", e);
        }

        ActivityLog activityLog = ActivityLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        activityLogRepository.save(activityLog);
        log.info("Audit Log Created: Action={}, User={}, IP={}", action, user.getUsername(), ipAddress);
    }
}
