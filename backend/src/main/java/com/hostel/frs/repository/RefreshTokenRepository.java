package com.hostel.frs.repository;

import com.hostel.frs.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true, r.revokedAt = CURRENT_TIMESTAMP " +
           "WHERE r.user.id = :userId AND r.revoked = false")
    int revokeAllActiveForUser(@Param("userId") Long userId);

    // Housekeeping: called by RefreshTokenCleanupTask so this table doesn't
    // grow unbounded with long-expired/revoked rows on a long-running instance.
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :cutoff")
    int deleteAllExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
