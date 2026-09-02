package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;

/** Кэш ответа посещаемости на время сессии в браузере. */
@Component
public class AttendanceCache {

    private static final long TTL_MS = Duration.ofMinutes(5).toMillis();

    private final ConcurrentHashMap<String, Entry> byKey = new ConcurrentHashMap<>();
    Optional<StudentAttendanceResponse> get(
        String studentId,
        LocalDate from,
        LocalDate to,
        String source
    ) {
        if (studentId == null || from == null || to == null || source == null) {
            return Optional.empty();
        }
        Entry entry = byKey.get(key(studentId, from, to, source));
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAtMs <= System.currentTimeMillis()) {
            byKey.remove(key(studentId, from, to, source), entry);
            return Optional.empty();
        }
        return Optional.of(entry.response);
    }

    void put(
        String studentId,
        LocalDate from,
        LocalDate to,
        String source,
        StudentAttendanceResponse response
    ) {
        if (studentId == null || from == null || to == null || source == null || response == null) {
            return;
        }
        byKey.put(
            key(studentId, from, to, source),
            new Entry(response, System.currentTimeMillis() + TTL_MS)
        );
        if (byKey.size() > 512) {
            long now = System.currentTimeMillis();
            byKey.entrySet().removeIf(e -> e.getValue().expiresAtMs <= now);
        }
    }

    private static String key(String studentId, LocalDate from, LocalDate to, String source) {
        return studentId + '|' + from + '|' + to + '|' + source;
    }

    private record Entry(StudentAttendanceResponse response, long expiresAtMs) {}
}
