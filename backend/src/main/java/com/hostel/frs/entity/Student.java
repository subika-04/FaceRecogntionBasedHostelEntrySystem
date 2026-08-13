package com.hostel.frs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Uniqueness is NOT enforced at the column level here on purpose. The
    // database only enforces uniqueness among non-deleted rows, via the
    // generated register_number_active column + uq_students_register_number_active
    // index (see V5__students_soft_delete_unique_fix.sql). Application-level
    // duplicate checks must go through
    // StudentRepository.existsByRegisterNumberAndIsDeletedFalse(...), which
    // mirrors that same "active rows only" scope.
    @Column(name = "register_number", nullable = false, length = 30)
    private String registerNumber;

    // Read-only mirror of register_number maintained by the database
    // (NULL when is_deleted = true). Not written to by the application --
    // exposed only so the generated column is visible to anyone inspecting
    // the entity/schema mapping; Hibernate never inserts/updates it.
    @Column(name = "register_number_active", insertable = false, updatable = false, length = 30)
    private String registerNumberActive;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "hostel_status", nullable = false, length = 20)
    private HostelStatus hostelStatus;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(name = "profile_image_url", nullable = false, length = 255)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "enrollment_status", length = 20)
    private EnrollmentStatus enrollmentStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by", nullable = false)
    private User registeredBy;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (enrollmentStatus == null) {
            enrollmentStatus = EnrollmentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
