package ru.ruc.lk.ruk_lk_api.api.auth;

import java.time.Instant;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.ProgramSummary;

/** Незавершённый вход: ждём код из выбранного канала. */
public record PendingChallenge(
    String studentId,
    String fullName,
    String email,
    String phone,
    Long maxUserId,
    LoginCodeChannel channel,
    String code,
    List<ProgramSummary> programs,
    Instant createdAt,
    int failedAttempts
) {
    public PendingChallenge withFailedAttempts(int attempts) {
        return new PendingChallenge(
            studentId,
            fullName,
            email,
            phone,
            maxUserId,
            channel,
            code,
            programs,
            createdAt,
            attempts
        );
    }
}
