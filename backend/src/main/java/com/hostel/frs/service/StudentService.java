package com.hostel.frs.service;

import com.hostel.frs.dto.SyncEmbeddingDto;
import com.hostel.frs.dto.request.FaceFrameRequest;
import com.hostel.frs.dto.request.StudentCreateRequest;
import com.hostel.frs.dto.response.FaceFrameResponse;
import com.hostel.frs.dto.response.StudentResponse;
import com.hostel.frs.entity.*;
import com.hostel.frs.exception.DuplicateResourceException;
import com.hostel.frs.exception.ResourceNotFoundException;
import com.hostel.frs.repository.FaceEmbeddingRepository;
import com.hostel.frs.repository.StudentRepository;
import com.hostel.frs.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@Slf4j
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FaceEmbeddingRepository faceEmbeddingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlaskAiClientService flaskAiClientService;

    @Autowired
    private ActivityLogService auditLogService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public StudentResponse createStudent(StudentCreateRequest request, String registeredByUsername) {
        if (studentRepository.existsByRegisterNumberAndIsDeletedFalse(request.getRegisterNumber())) {
            throw new DuplicateResourceException("Student with register number " + request.getRegisterNumber() + " already exists");
        }

        User staff = userRepository.findByUsername(registeredByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found: " + registeredByUsername));

        Student student = Student.builder()
                .registerNumber(request.getRegisterNumber())
                .fullName(request.getFullName())
                .department(request.getDepartment())
                .year(request.getYear())
                .hostelStatus(request.getHostelStatus())
                .phone(request.getPhone())
                .email(request.getEmail())
                .enrollmentStatus(EnrollmentStatus.PENDING)
                .profileImageUrl("PENDING") // Will be updated on enrollment complete
                .registeredBy(staff)
                .isDeleted(false)
                .build();

        student = studentRepository.save(student);

        auditLogService.log(staff, "STUDENT_CREATED", "STUDENT", student.getId(), 
                String.format("Student record created (Register Number: %s)", student.getRegisterNumber()));

        return mapToStudentResponse(student);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> searchStudents(String query, Pageable pageable) {
        return studentRepository.searchStudents(query, pageable).map(this::mapToStudentResponse);
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));
        return mapToStudentResponse(student);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentCreateRequest request, String updatedByUsername) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        User staff = userRepository.findByUsername(updatedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + updatedByUsername));

        // Check if register number is changing and conflicts
        if (!student.getRegisterNumber().equals(request.getRegisterNumber())) {
            if (studentRepository.existsByRegisterNumberAndIsDeletedFalse(request.getRegisterNumber())) {
                throw new DuplicateResourceException("Student with register number " + request.getRegisterNumber() + " already exists");
            }
        }

        student.setRegisterNumber(request.getRegisterNumber());
        student.setFullName(request.getFullName());
        student.setDepartment(request.getDepartment());
        student.setYear(request.getYear());
        student.setHostelStatus(request.getHostelStatus());
        student.setPhone(request.getPhone());
        student.setEmail(request.getEmail());

        student = studentRepository.save(student);

        auditLogService.log(staff, "STUDENT_UPDATED", "STUDENT", student.getId(), "Student details updated");

        return mapToStudentResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id, String deletedByUsername) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        User staff = userRepository.findByUsername(deletedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + deletedByUsername));

        student.setIsDeleted(true);
        studentRepository.save(student);

        // Delete from database embeddings (Cascade or manual)
        faceEmbeddingRepository.deleteByStudentId(student.getId());

        // Notify Flask AI Service to remove student embeddings from cache RAM
        try {
            flaskAiClientService.deleteStudentCache(student.getId());
        } catch (Exception e) {
            log.error("Failed to delete Flask cache for student ID={}. Will be out of sync until next restart.", student.getId(), e);
        }

        auditLogService.log(staff, "STUDENT_DELETED", "STUDENT", student.getId(), 
                String.format("Student deleted (Register Number: %s)", student.getRegisterNumber()));
    }

    @Transactional
    public FaceFrameResponse processEnrollmentFrame(Long studentId, FaceFrameRequest request) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        String base64ImageClean = request.getImage();
        if (base64ImageClean.contains(",")) {
            base64ImageClean = base64ImageClean.split(",")[1];
        }

        // 1. Quality evaluation from Flask
        FaceFrameResponse response = flaskAiClientService.checkQuality(base64ImageClean);

        if (response.isAccepted()) {
            // 2. Save frame temporarily to disk
            try {
                Path tempDirPath = Paths.get(uploadDir, "temp", "student_" + studentId);
                Files.createDirectories(tempDirPath);

                byte[] imageBytes = Base64.getDecoder().decode(base64ImageClean);
                Path tempFramePath = tempDirPath.resolve("pose_" + request.getPose().name() + ".jpg");
                Files.write(tempFramePath, imageBytes);
                log.info("Temporarily stored {} pose frame for student ID={}", request.getPose(), studentId);
            } catch (IOException e) {
                log.error("Failed to write transient pose frame for student ID={}", studentId, e);
                return FaceFrameResponse.builder()
                        .accepted(false)
                        .reason("SERVER_IO_ERROR")
                        .build();
            }
        }

        return response;
    }

    @Transactional
    public StudentResponse completeEnrollment(Long studentId, String completedByUsername) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        User staff = userRepository.findByUsername(completedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + completedByUsername));

        Path tempDirPath = Paths.get(uploadDir, "temp", "student_" + studentId);
        
        // Ensure all 5 poses exist in temporary storage
        for (Pose pose : Pose.values()) {
            Path posePath = tempDirPath.resolve("pose_" + pose.name() + ".jpg");
            if (!Files.exists(posePath)) {
                throw new IllegalArgumentException("Biometric enrollment incomplete: Missing pose " + pose.name());
            }
        }

        List<FaceEmbedding> embeddingsToSave = new ArrayList<>();
        List<SyncEmbeddingDto> syncEmbeddings = new ArrayList<>();

        try {
            // 1. Generate and save embedding for each pose
            for (Pose pose : Pose.values()) {
                Path posePath = tempDirPath.resolve("pose_" + pose.name() + ".jpg");
                byte[] imageBytes = Files.readAllBytes(posePath);
                String base64Image = Base64.getEncoder().encodeToString(imageBytes);

                float[] vector = flaskAiClientService.generateEmbedding(base64Image);

                FaceEmbedding embedding = FaceEmbedding.builder()
                        .student(student)
                        .pose(pose)
                        .embeddingVector(vector)
                        .modelVersion("insightface-buffalo_l-v1")
                        .build();

                embeddingsToSave.add(embedding);
                syncEmbeddings.add(new SyncEmbeddingDto(pose.name(), vector));
            }

            // Save in database
            faceEmbeddingRepository.deleteByStudentId(studentId); // Clear any old enrollment attempts
            faceEmbeddingRepository.saveAll(embeddingsToSave);

            // 2. Make STRAIGHT pose the permanent profile picture
            Path permanentDirPath = Paths.get(uploadDir);
            Files.createDirectories(permanentDirPath);
            
            Path straightPosePath = tempDirPath.resolve("pose_" + Pose.STRAIGHT.name() + ".jpg");
            String filename = "student_" + studentId + ".jpg";
            Path permanentProfilePath = permanentDirPath.resolve(filename);
            
            Files.copy(straightPosePath, permanentProfilePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // 3. Clean up temp files
            Files.walk(tempDirPath)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);

            // 4. Update student record
            student.setEnrollmentStatus(EnrollmentStatus.ENROLLED);
            // Profile image URL served via custom image endpoint
            student.setProfileImageUrl("/students/images/" + filename);
            student = studentRepository.save(student);

            // 5. Update Flask RAM Cache with new embeddings
            flaskAiClientService.refreshStudentCache(studentId, syncEmbeddings);

            auditLogService.log(staff, "STUDENT_ENROLLED", "STUDENT", student.getId(), 
                    String.format("Biometric face enrollment completed (Register Number: %s)", student.getRegisterNumber()));

            return mapToStudentResponse(student);

        } catch (IOException e) {
            log.error("IO error completing enrollment for student ID={}", studentId, e);
            throw new RuntimeException("Server error saving biometric images", e);
        }
    }

    private StudentResponse mapToStudentResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .registerNumber(student.getRegisterNumber())
                .fullName(student.getFullName())
                .department(student.getDepartment())
                .year(student.getYear())
                .hostelStatus(student.getHostelStatus().name())
                .phone(student.getPhone())
                .email(student.getEmail())
                .profileImageUrl(student.getProfileImageUrl())
                .enrollmentStatus(student.getEnrollmentStatus().name())
                .registeredByUsername(student.getRegisteredBy().getUsername())
                .createdAt(student.getCreatedAt())
                .build();
    }
}
