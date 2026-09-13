package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;

/** Кэш и защита от повторных запросов одного и того же периода. */
@Component
public class AttendanceCache {

    static final long TTL_MS = Duration.ofMinutes(20).toMillis();
    static final long FAIL_COOLDOWN_MS = Duration.ofSeconds(15).toMillis();

    private final ConcurrentHashMap<String, Entry> byKey = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<StudentAttendanceResponse>> inflight =
        new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> failedUntilMs = new ConcurrentHashMap<>();

    Optional<StudentAttendanceResponse> get(
        String studentId,
        LocalDate from,
        LocalDate to,
        String source
    ) {
        String cacheKey = key(studentId, from, to, source);
        if (cacheKey == null) {
            return Optional.empty();
        }
        Entry entry = byKey.get(cacheKey);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAtMs <= System.currentTimeMillis()) {
            byKey.remove(cacheKey, entry);
            return Optional.empty();
        }
        return Optional.of(entry.response);
    }

    /**
     * Успешный ответ из кэша, либо один живой запрос на ключ.
     * Повтор того же периода сразу после ошибки — 429.
     */
    StudentAttendanceResponse getOrLoad(
        String studentId,
        LocalDate from,
        LocalDate to,
        String source,
        Supplier<StudentAttendanceResponse> loader
    ) {
        Optional<StudentAttendanceResponse> cached = get(studentId, from, to, source);
        if (cached.isPresent()) {
            return cached.get();
        }
        String cacheKey = key(studentId, from, to, source);
        if (cacheKey == null) {
            return loader.get();
        }
        checkCooldown(cacheKey);

        CompletableFuture<StudentAttendanceResponse> created = new CompletableFuture<>();
        CompletableFuture<StudentAttendanceResponse> existing = inflight.putIfAbsent(cacheKey, created);
        if (existing != null) {
            return join(existing);
        }
        try {
            StudentAttendanceResponse loaded = loader.get();
            put(studentId, from, to, source, loaded);
            failedUntilMs.remove(cacheKey);
            created.complete(loaded);
            return loaded;
        } catch (Throwable error) {
            failedUntilMs.put(cacheKey, System.currentTimeMillis() + FAIL_COOLDOWN_MS);
            created.completeExceptionally(error);
            throw wrap(error);
        } finally {
            inflight.remove(cacheKey, created);
        }
    }

    void put(
        String studentId,
        LocalDate from,
        LocalDate to,
        String source,
        StudentAttendanceResponse response
    ) {
        String cacheKey = key(studentId, from, to, source);
        if (cacheKey == null || response == null) {
            return;
        }
        byKey.put(cacheKey, new Entry(response, System.currentTimeMillis() + TTL_MS));
        if (byKey.size() > 512) {
            long now = System.currentTimeMillis();
            byKey.entrySet().removeIf(e -> e.getValue().expiresAtMs <= now);
        }
    }

    private void checkCooldown(String cacheKey) {
        Long until = failedUntilMs.get(cacheKey);
        if (until == null) {
            return;
        }
        long now = System.currentTimeMillis();
        if (until <= now) {
            failedUntilMs.remove(cacheKey, until);
            return;
        }
        long retryAfterSec = Math.max(1, (until - now + 999) / 1000);
        throw new ResponseStatusException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Подождите " + retryAfterSec + " с. перед повторным запросом за этот период"
        );
    }

    private static StudentAttendanceResponse join(CompletableFuture<StudentAttendanceResponse> future) {
        try {
            return future.join();
        } catch (CompletionException ex) {
            throw wrap(ex.getCause() != null ? ex.getCause() : ex);
        }
    }

    private static RuntimeException wrap(Throwable error) {
        if (error instanceof RuntimeException runtime) {
            return runtime;
        }
        return new CompletionException(error);
    }

    static String key(String studentId, LocalDate from, LocalDate to, String source) {
        if (studentId == null || from == null || to == null || source == null) {
            return null;
        }
        return studentId + '|' + from + '|' + to + '|' + source;
    }

    private record Entry(StudentAttendanceResponse response, long expiresAtMs) {}
}
