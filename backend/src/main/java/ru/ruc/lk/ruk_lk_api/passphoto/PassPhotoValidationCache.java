package ru.ruc.lk.ruk_lk_api.passphoto;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Кэш успешной серверной проверки фото: тот же файл (SHA-256) в пределах TTL
 * не гоняет YuNet повторно на submit.
 */
@Component
public class PassPhotoValidationCache {

    private final ConcurrentHashMap<String, Entry> byStudentId = new ConcurrentHashMap<>();

    public void put(String studentId, String contentSha256, PassPhotoValidationResult result, Duration ttl) {
        if (studentId == null || studentId.isBlank() || contentSha256 == null || result == null) {
            return;
        }
        if (result.hasFailures()) {
            return;
        }
        Duration effective = ttl == null || ttl.isNegative() || ttl.isZero()
            ? Duration.ofMinutes(5)
            : ttl;
        byStudentId.put(studentId, new Entry(contentSha256, result, Instant.now().plus(effective)));
    }

    public Optional<PassPhotoValidationResult> getIfMatch(String studentId, String contentSha256) {
        if (studentId == null || contentSha256 == null) {
            return Optional.empty();
        }
        Entry entry = byStudentId.get(studentId);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            byStudentId.remove(studentId, entry);
            return Optional.empty();
        }
        if (!entry.contentSha256().equals(contentSha256)) {
            return Optional.empty();
        }
        return Optional.of(entry.result());
    }

    public void invalidate(String studentId) {
        if (studentId != null) {
            byStudentId.remove(studentId);
        }
    }

    private record Entry(String contentSha256, PassPhotoValidationResult result, Instant expiresAt) {}
}
