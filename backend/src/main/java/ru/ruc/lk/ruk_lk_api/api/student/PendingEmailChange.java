package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.Instant;

/**
 * Ожидание кода подтверждения смены личной почты (хранится в HTTP-сессии).
 */
public record PendingEmailChange(
    String newEmail,
    String code,
    Instant createdAt,
    int failedAttempts
) {
    public PendingEmailChange withFailedAttempts(int attempts) {
        return new PendingEmailChange(newEmail, code, createdAt, attempts);
    }
}
