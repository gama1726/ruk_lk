package ru.ruc.lk.ruk_lk_api.integration.max;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaxBindTokenRepository extends JpaRepository<MaxBindToken, String> {
    List<MaxBindToken> findByStudentId(String studentId);

    Optional<MaxBindToken> findFirstByPendingMaxUserIdAndExpiresAtAfterOrderByExpiresAtDesc(
        Long pendingMaxUserId,
        Instant now
    );

    void deleteByStudentId(String studentId);
}
