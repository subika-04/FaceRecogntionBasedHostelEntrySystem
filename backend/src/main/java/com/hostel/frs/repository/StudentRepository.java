package com.hostel.frs.repository;

import com.hostel.frs.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hostel.frs.entity.EnrollmentStatus;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    Optional<Student> findByRegisterNumberAndIsDeletedFalse(String registerNumber);
    
    Optional<Student> findByIdAndIsDeletedFalse(Long id);
    
    boolean existsByRegisterNumberAndIsDeletedFalse(String registerNumber);

    long countByIsDeletedFalse();

    long countByEnrollmentStatusAndIsDeletedFalse(EnrollmentStatus enrollmentStatus);

    @Query("SELECT s FROM Student s WHERE s.isDeleted = false AND " +
           "(:query IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.registerNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.department) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Student> searchStudents(@Param("query") String query, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.isDeleted = false AND " +
           "(:status IS NULL OR s.enrollmentStatus = :status) AND " +
           "(:query IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.registerNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Student> filterStudentsForReport(
            @Param("status") EnrollmentStatus status,
            @Param("query") String query,
            Pageable pageable);
}
