package com.hostel.frs.repository;

import com.hostel.frs.entity.FaceEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceEmbeddingRepository extends JpaRepository<FaceEmbedding, Long> {
    
    List<FaceEmbedding> findByStudentId(Long studentId);
    
    void deleteByStudentId(Long studentId);

    @Query("SELECT fe FROM FaceEmbedding fe WHERE fe.student.isDeleted = false")
    List<FaceEmbedding> findAllActiveEmbeddings();
}
