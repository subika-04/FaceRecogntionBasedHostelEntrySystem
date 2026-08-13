package com.hostel.frs.repository;

import com.hostel.frs.entity.RecognitionHistory;
import com.hostel.frs.entity.RecognitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecognitionHistoryRepository extends JpaRepository<RecognitionHistory, Long> {
    
    Page<RecognitionHistory> findByTriggeredById(Long userId, Pageable pageable);

    @Query("SELECT r FROM RecognitionHistory r WHERE " +
           "(:triggeredById IS NULL OR r.triggeredBy.id = :triggeredById) AND " +
           "(:studentId IS NULL OR r.student.id = :studentId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:camera IS NULL OR LOWER(r.recognizedByCamera) LIKE LOWER(CONCAT('%', :camera, '%')))")
    Page<RecognitionHistory> searchHistory(
            @Param("triggeredById") Long triggeredById,
            @Param("studentId") Long studentId,
            @Param("status") RecognitionStatus status,
            @Param("camera") String camera,
            Pageable pageable);

    // Dynamic search with date ranges for analytics and reporting
    @Query("SELECT r FROM RecognitionHistory r WHERE " +
           "(:studentId IS NULL OR r.student.id = :studentId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:camera IS NULL OR LOWER(r.recognizedByCamera) LIKE LOWER(CONCAT('%', :camera, '%'))) AND " +
           "(:startDate IS NULL OR r.recognizedAt >= :startDate) AND " +
           "(:endDate IS NULL OR r.recognizedAt <= :endDate)")
    Page<RecognitionHistory> filterHistoryForReport(
            @Param("studentId") Long studentId,
            @Param("status") RecognitionStatus status,
            @Param("camera") String camera,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Dynamic count queries for analytics
    long countByStatus(RecognitionStatus status);

    // Projections for dashboard charts
    interface TrendProjection {
        String getLabel();
        Long getCount();
    }

    interface PeakHourProjection {
        Integer getHour();
        Long getCount();
    }

    interface CameraCountProjection {
        String getCamera();
        Long getCount();
    }

    interface RecognitionHistoryProjection {
        Long getId();
        String getRecognizedByCamera();
        BigDecimal getConfidenceScore();
        String getStatus();
        Integer getRecognitionDurationMs();
        LocalDateTime getRecognizedAt();

        // Flattened Student Properties to prevent entity leakage
        Long getStudentId();
        String getStudentRegisterNumber();
        String getStudentFullName();
        String getStudentDepartment();
        Integer getStudentYear();
        String getStudentHostelStatus();
        String getStudentPhone();
        String getStudentEmail();
        String getStudentProfileImageUrl();
        String getStudentEnrollmentStatus();
        String getStudentRegisteredByUsername();
        LocalDateTime getStudentCreatedAt();

        // Flattened User Trigger
        String getTriggeredByUsername();
    }

    // Trend grouping queries
    @Query(value = "SELECT DATE_FORMAT(recognized_at, '%Y-%m-%d') as label, COUNT(*) as count " +
                   "FROM recognition_history WHERE recognized_at >= :startDate " +
                   "GROUP BY label ORDER BY label ASC", nativeQuery = true)
    List<TrendProjection> getDailyTrends(@Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT DATE_FORMAT(recognized_at, '%Y-W%u') as label, COUNT(*) as count " +
                   "FROM recognition_history WHERE recognized_at >= :startDate " +
                   "GROUP BY label ORDER BY label ASC", nativeQuery = true)
    List<TrendProjection> getWeeklyTrends(@Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT DATE_FORMAT(recognized_at, '%Y-%m') as label, COUNT(*) as count " +
                   "FROM recognition_history WHERE recognized_at >= :startDate " +
                   "GROUP BY label ORDER BY label ASC", nativeQuery = true)
    List<TrendProjection> getMonthlyTrends(@Param("startDate") LocalDateTime startDate);

    // Peak hours query
    @Query(value = "SELECT HOUR(recognized_at) as hour, COUNT(*) as count " +
                   "FROM recognition_history GROUP BY hour ORDER BY hour ASC", nativeQuery = true)
    List<PeakHourProjection> getPeakHours();

    // Top camera sources query
    @Query(value = "SELECT recognized_by_camera as camera, COUNT(*) as count " +
                   "FROM recognition_history GROUP BY recognized_by_camera " +
                   "ORDER BY count DESC LIMIT :limit", nativeQuery = true)
    List<CameraCountProjection> getTopCameras(@Param("limit") int limit);

    // Projection-only queries to prevent entity leakage
    @Query("SELECT r.id as id, r.recognizedByCamera as recognizedByCamera, r.confidenceScore as confidenceScore, " +
           "CAST(r.status as String) as status, r.recognitionDurationMs as recognitionDurationMs, r.recognizedAt as recognizedAt, " +
           "s.id as studentId, s.registerNumber as studentRegisterNumber, " +
           "s.fullName as studentFullName, s.department as studentDepartment, " +
           "s.year as studentYear, CAST(s.hostelStatus as String) as studentHostelStatus, " +
           "s.phone as studentPhone, s.email as studentEmail, " +
           "s.profileImageUrl as studentProfileImageUrl, CAST(s.enrollmentStatus as String) as studentEnrollmentStatus, " +
           "sb.username as studentRegisteredByUsername, s.createdAt as studentCreatedAt, " +
           "tb.username as triggeredByUsername " +
           "FROM RecognitionHistory r " +
           "LEFT JOIN r.student s " +
           "LEFT JOIN s.registeredBy sb " +
           "LEFT JOIN r.triggeredBy tb " +
           "WHERE r.status = com.hostel.frs.entity.RecognitionStatus.MATCHED " +
           "ORDER BY r.recognizedAt DESC")
    List<RecognitionHistoryProjection> findRecentSuccessful(Pageable pageable);

    @Query("SELECT r.id as id, r.recognizedByCamera as recognizedByCamera, r.confidenceScore as confidenceScore, " +
           "CAST(r.status as String) as status, r.recognitionDurationMs as recognitionDurationMs, r.recognizedAt as recognizedAt, " +
           "s.id as studentId, s.registerNumber as studentRegisterNumber, " +
           "s.fullName as studentFullName, s.department as studentDepartment, " +
           "s.year as studentYear, CAST(s.hostelStatus as String) as studentHostelStatus, " +
           "s.phone as studentPhone, s.email as studentEmail, " +
           "s.profileImageUrl as studentProfileImageUrl, CAST(s.enrollmentStatus as String) as studentEnrollmentStatus, " +
           "sb.username as studentRegisteredByUsername, s.createdAt as studentCreatedAt, " +
           "tb.username as triggeredByUsername " +
           "FROM RecognitionHistory r " +
           "LEFT JOIN r.student s " +
           "LEFT JOIN s.registeredBy sb " +
           "LEFT JOIN r.triggeredBy tb " +
           "ORDER BY r.recognizedAt DESC")
    List<RecognitionHistoryProjection> findRecentActivity(Pageable pageable);
}
