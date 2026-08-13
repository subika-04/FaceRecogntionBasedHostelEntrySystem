package com.hostel.frs.repository;

import com.hostel.frs.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT u FROM User u WHERE u.role.name = 'STAFF' AND " +
           "(:query IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchStaff(@Param("query") String query, Pageable pageable);

    /**
     * General-purpose user management search used by UserController/UserService
     * -- unlike searchStaff (kept above for backward compatibility with
     * whatever originally called it), this covers every role and supports an
     * optional role/status filter alongside the free-text query, which is
     * what an admin-facing "manage all accounts" screen actually needs.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:query IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:role IS NULL OR u.role.name = :role) AND " +
           "(:status IS NULL OR u.status = :status)")
    Page<User> searchUsers(@Param("query") String query,
                            @Param("role") String role,
                            @Param("status") com.hostel.frs.entity.UserStatus status,
                            Pageable pageable);
}
