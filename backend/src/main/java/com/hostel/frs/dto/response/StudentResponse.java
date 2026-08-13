package com.hostel.frs.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {
    private Long id;
    private String registerNumber;
    private String fullName;
    private String department;
    private Integer year;
    private String hostelStatus;
    private String phone;
    private String email;
    private String profileImageUrl;
    private String enrollmentStatus;
    private String registeredByUsername;
    private LocalDateTime createdAt;
}
