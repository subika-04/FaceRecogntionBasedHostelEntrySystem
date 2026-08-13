package com.hostel.frs.service;

import com.hostel.frs.entity.*;
import com.hostel.frs.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class ReportService {

    @Autowired
    private RecognitionHistoryRepository recognitionHistoryRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int CHUNK_SIZE = 1000;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional(readOnly = true)
    public StreamingResponseBody exportRecognitionHistory(
            Long studentId, RecognitionStatus status, String camera, LocalDateTime startDate, LocalDateTime endDate) {
        
        log.info("Report Service: Initiating export for recognition history report...");
        
        return outputStream -> {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
                // Write UTF-8 BOM
                writer.write("\uFEFF");
                
                // Write Header
                writer.write("ID,Recognized At,Register Number,Student Full Name,Department,Year,Camera Source,Confidence Score,Status,Triggered By,Duration (ms)\n");
                
                int page = 0;
                boolean hasMore = true;
                
                while (hasMore) {
                    Pageable pageable = PageRequest.of(page, CHUNK_SIZE);
                    Page<RecognitionHistory> chunk = recognitionHistoryRepository.filterHistoryForReport(
                            studentId, status, camera, startDate, endDate, pageable);
                    
                    for (RecognitionHistory history : chunk.getContent()) {
                        String studentReg = history.getStudent() != null ? history.getStudent().getRegisterNumber() : "N/A";
                        String studentName = history.getStudent() != null ? history.getStudent().getFullName() : "UNKNOWN";
                        String studentDept = history.getStudent() != null ? history.getStudent().getDepartment() : "N/A";
                        String studentYear = history.getStudent() != null && history.getStudent().getYear() != null 
                                ? String.valueOf(history.getStudent().getYear()) : "N/A";
                        String triggeredBy = history.getTriggeredBy() != null ? history.getTriggeredBy().getUsername() : "SYSTEM";
                        String statusStr = history.getStatus() != null ? history.getStatus().name() : "";
                        
                        writer.write(String.format("%d,%s,%s,%s,%s,%s,%s,%.4f,%s,%s,%d\n",
                                history.getId(),
                                history.getRecognizedAt() != null ? history.getRecognizedAt().format(DATE_TIME_FORMATTER) : "",
                                escapeCsvField(studentReg),
                                escapeCsvField(studentName),
                                escapeCsvField(studentDept),
                                studentYear,
                                escapeCsvField(history.getRecognizedByCamera()),
                                history.getConfidenceScore() != null ? history.getConfidenceScore().doubleValue() : 0.0,
                                statusStr,
                                escapeCsvField(triggeredBy),
                                history.getRecognitionDurationMs() != null ? history.getRecognitionDurationMs() : 0
                        ));
                    }
                    
                    writer.flush();
                    entityManager.clear(); // Free memory
                    
                    hasMore = chunk.hasNext();
                    page++;
                }
            } catch (IOException e) {
                log.error("Error writing recognition history CSV stream", e);
                throw e;
            }
        };
    }

    @Transactional(readOnly = true)
    public StreamingResponseBody exportStudents(EnrollmentStatus status, String query) {
        log.info("Report Service: Initiating export for student directory report...");
        
        return outputStream -> {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
                // Write UTF-8 BOM
                writer.write("\uFEFF");
                
                // Write Header
                writer.write("ID,Register Number,Full Name,Department,Year,Hostel Status,Phone,Email,Enrollment Status,Registered By,Created At\n");
                
                int page = 0;
                boolean hasMore = true;
                
                while (hasMore) {
                    Pageable pageable = PageRequest.of(page, CHUNK_SIZE);
                    Page<Student> chunk = studentRepository.filterStudentsForReport(status, query, pageable);
                    
                    for (Student student : chunk.getContent()) {
                        String registeredBy = student.getRegisteredBy() != null ? student.getRegisteredBy().getUsername() : "SYSTEM";
                        String hostelStr = student.getHostelStatus() != null ? student.getHostelStatus().name() : "";
                        String enrollStr = student.getEnrollmentStatus() != null ? student.getEnrollmentStatus().name() : "";
                        
                        writer.write(String.format("%d,%s,%s,%s,%d,%s,%s,%s,%s,%s,%s\n",
                                student.getId(),
                                escapeCsvField(student.getRegisterNumber()),
                                escapeCsvField(student.getFullName()),
                                escapeCsvField(student.getDepartment()),
                                student.getYear() != null ? student.getYear() : 0,
                                hostelStr,
                                escapeCsvField(student.getPhone()),
                                escapeCsvField(student.getEmail()),
                                enrollStr,
                                escapeCsvField(registeredBy),
                                student.getCreatedAt() != null ? student.getCreatedAt().format(DATE_TIME_FORMATTER) : ""
                        ));
                    }
                    
                    writer.flush();
                    entityManager.clear(); // Free memory
                    
                    hasMore = chunk.hasNext();
                    page++;
                }
            } catch (IOException e) {
                log.error("Error writing student directory CSV stream", e);
                throw e;
            }
        };
    }

    @Transactional(readOnly = true)
    public StreamingResponseBody exportActivityLogs(Long userId, String action, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Report Service: Initiating export for activity logs report...");
        
        return outputStream -> {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
                // Write UTF-8 BOM
                writer.write("\uFEFF");
                
                // Write Header
                writer.write("ID,Created At,User,Action,Entity Type,Entity ID,IP Address,User Agent,Change Details\n");
                
                int page = 0;
                boolean hasMore = true;
                
                while (hasMore) {
                    Pageable pageable = PageRequest.of(page, CHUNK_SIZE);
                    Page<ActivityLog> chunk = activityLogRepository.filterLogsForReport(userId, action, startDate, endDate, pageable);
                    
                    for (ActivityLog logEntry : chunk.getContent()) {
                        String username = logEntry.getUser() != null ? logEntry.getUser().getUsername() : "SYSTEM";
                        
                        writer.write(String.format("%d,%s,%s,%s,%s,%s,%s,%s,%s\n",
                                logEntry.getId(),
                                logEntry.getCreatedAt() != null ? logEntry.getCreatedAt().format(DATE_TIME_FORMATTER) : "",
                                escapeCsvField(username),
                                escapeCsvField(logEntry.getAction()),
                                escapeCsvField(logEntry.getEntityType()),
                                logEntry.getEntityId() != null ? String.valueOf(logEntry.getEntityId()) : "N/A",
                                escapeCsvField(logEntry.getIpAddress()),
                                escapeCsvField(logEntry.getUserAgent()),
                                escapeCsvField(logEntry.getDetails())
                        ));
                    }
                    
                    writer.flush();
                    entityManager.clear(); // Free memory
                    
                    hasMore = chunk.hasNext();
                    page++;
                }
            } catch (IOException e) {
                log.error("Error writing activity logs CSV stream", e);
                throw e;
            }
        };
    }

    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        
        // Escape CSV injection characters: '=', '+', '-', '@'
        String escaped = field;
        if (escaped.startsWith("=") || escaped.startsWith("+") || escaped.startsWith("-") || escaped.startsWith("@")) {
            escaped = "'" + escaped;
        }
        
        // Escape double-quotes, commas, newlines by wrapping field in double-quotes and doubling any internal quotes
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped.replace("\"", "\"\"") + "\"";
        }
        
        return escaped;
    }
}
