package com.hostel.frs.service;

import com.hostel.frs.entity.RefreshToken;
import com.hostel.frs.entity.User;
import com.hostel.frs.exception.UnauthorizedException;
import com.hostel.frs.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;

    private User user;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService();
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenRepository", refreshTokenRepository);
        ReflectionTestUtils.setField(refreshTokenService, "jwtRefreshExpirationMs", 604800000L);
        user = User.builder().id(1L).username("jdoe").build();
    }

    @Test
    void issuePersistsAHashNotTheRawToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        refreshTokenService.issue(user, "raw-refresh-token-value", "127.0.0.1", "Mozilla/5.0");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken saved = captor.getValue();

        assertThat(saved.getTokenHash()).doesNotContain("raw-refresh-token-value");
        assertThat(saved.getTokenHash()).hasSize(64); // SHA-256 hex digest length
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    void requireValidRejectsUnknownToken() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.requireValid("never-issued"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("not recognized");
    }

    @Test
    void requireValidRejectsRevokedToken() {
        RefreshToken revoked = RefreshToken.builder()
                .id(1L).user(user).tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(true).build();
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> refreshTokenService.requireValid("some-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    void requireValidRejectsExpiredToken() {
        RefreshToken expired = RefreshToken.builder()
                .id(1L).user(user).tokenHash("hash")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .revoked(false).build();
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.requireValid("some-token"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void requireValidAcceptsAGenuinelyValidToken() {
        RefreshToken valid = RefreshToken.builder()
                .id(1L).user(user).tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false).build();
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(valid));

        RefreshToken result = refreshTokenService.requireValid("some-token");
        assertThat(result).isEqualTo(valid);
    }

    @Test
    void revokeMarksTokenRevokedWithTimestamp() {
        RefreshToken token = RefreshToken.builder().id(1L).user(user).tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusDays(1)).revoked(false).build();
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        refreshTokenService.revoke(token);

        assertThat(token.getRevoked()).isTrue();
        assertThat(token.getRevokedAt()).isNotNull();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    void revokeAllForUserDelegatesToRepositoryBulkUpdate() {
        when(refreshTokenRepository.revokeAllActiveForUser(1L)).thenReturn(4);

        int result = refreshTokenService.revokeAllForUser(1L);

        assertThat(result).isEqualTo(4);
        verify(refreshTokenRepository).revokeAllActiveForUser(1L);
    }

    @Test
    void revokeByRawTokenIsANoOpForBlankInput() {
        refreshTokenService.revokeByRawToken(null);
        refreshTokenService.revokeByRawToken("");
        verifyNoInteractions(refreshTokenRepository);
    }
}
