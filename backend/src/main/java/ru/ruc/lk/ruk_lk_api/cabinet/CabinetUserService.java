package ru.ruc.lk.ruk_lk_api.cabinet;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetStatsDayDto;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetStatsResponse;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetUserListItemDto;

@Service
public class CabinetUserService {

    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");
    private static final long TOUCH_THROTTLE_MS = 120_000L;
    private static final long ONLINE_WINDOW_MINUTES = 15L;

    private final CabinetUserRepository repository;
    private final ConcurrentHashMap<String, Long> touchThrottle = new ConcurrentHashMap<>();

    public CabinetUserService(CabinetUserRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void recordStudentLogin(StudentSession student) {
        if (student == null || blank(student.studentId())) {
            return;
        }
        String id = studentKey(student.studentId());
        Instant now = Instant.now();
        CabinetUser user = repository.findById(id).orElse(null);
        String name = blank(student.fullName()) ? student.studentId().trim() : student.fullName().trim();
        if (user == null) {
            repository.save(new CabinetUser(
                id,
                CabinetUserRole.STUDENT,
                student.studentId().trim(),
                null,
                name,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        repository.save(user);
    }

    @Transactional
    public void recordParentLogin(ParentSession parent) {
        if (parent == null || blank(parent.studentId())) {
            return;
        }
        String id = parentKey(parent.studentId(), parent.memberIndex());
        Instant now = Instant.now();
        String name = blank(parent.parentFullName())
            ? ("Родитель · " + parent.studentId().trim())
            : parent.parentFullName().trim();
        CabinetUser user = repository.findById(id).orElse(null);
        if (user == null) {
            repository.save(new CabinetUser(
                id,
                CabinetUserRole.PARENT,
                parent.studentId().trim(),
                String.valueOf(parent.memberIndex()),
                name,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        repository.save(user);
    }

    @Transactional
    public void touchStudent(StudentSession student) {
        if (student == null || blank(student.studentId())) {
            return;
        }
        touch(studentKey(student.studentId()), CabinetUserRole.STUDENT, student.studentId().trim(), null,
            blank(student.fullName()) ? student.studentId().trim() : student.fullName().trim());
    }

    @Transactional
    public void touchParent(ParentSession parent) {
        if (parent == null || blank(parent.studentId())) {
            return;
        }
        String name = blank(parent.parentFullName())
            ? ("Родитель · " + parent.studentId().trim())
            : parent.parentFullName().trim();
        touch(
            parentKey(parent.studentId(), parent.memberIndex()),
            CabinetUserRole.PARENT,
            parent.studentId().trim(),
            String.valueOf(parent.memberIndex()),
            name
        );
    }

    @Transactional(readOnly = true)
    public CabinetStatsResponse stats(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now(MOSCOW) : to;
        LocalDate begin = from == null ? end.minusDays(29) : from;
        if (begin.isAfter(end)) {
            LocalDate swap = begin;
            begin = end;
            end = swap;
        }
        if (begin.plusDays(92).isBefore(end)) {
            begin = end.minusDays(91);
        }

        Instant rangeStart = begin.atStartOfDay(MOSCOW).toInstant();
        Instant rangeEndExclusive = end.plusDays(1).atStartOfDay(MOSCOW).toInstant();
        Instant onlineSince = Instant.now().minusSeconds(ONLINE_WINDOW_MINUTES * 60);

        long total = repository.count();
        long online = repository.countByLastSeenAtGreaterThanEqual(onlineSince);
        long newInRange = repository.countByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
            rangeStart,
            rangeEndExclusive
        );

        Map<LocalDate, long[]> byDay = new HashMap<>();
        for (CabinetUser user : repository.findByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
            rangeStart,
            rangeEndExclusive
        )) {
            LocalDate day = user.getFirstLoginAt().atZone(MOSCOW).toLocalDate();
            long[] counters = byDay.computeIfAbsent(day, d -> new long[2]);
            if (user.getRole() == CabinetUserRole.PARENT) {
                counters[1]++;
            } else {
                counters[0]++;
            }
        }

        List<CabinetStatsDayDto> series = new ArrayList<>();
        for (LocalDate day = begin; !day.isAfter(end); day = day.plusDays(1)) {
            long[] counters = byDay.getOrDefault(day, new long[] {0, 0});
            series.add(new CabinetStatsDayDto(day.toString(), counters[0], counters[1], counters[0] + counters[1]));
        }

        List<CabinetUserListItemDto> recent = repository
            .findAllByOrderByFirstLoginAtDesc(PageRequest.of(0, 100))
            .stream()
            .map(this::toListItem)
            .toList();

        return new CabinetStatsResponse(
            total,
            online,
            newInRange,
            ONLINE_WINDOW_MINUTES,
            begin.toString(),
            end.toString(),
            series,
            recent
        );
    }

    private void touch(
        String id,
        CabinetUserRole role,
        String studentId,
        String parentKey,
        String displayName
    ) {
        long nowMs = System.currentTimeMillis();
        Long prev = touchThrottle.get(id);
        if (prev != null && nowMs - prev < TOUCH_THROTTLE_MS) {
            return;
        }
        touchThrottle.put(id, nowMs);

        Instant now = Instant.ofEpochMilli(nowMs);
        CabinetUser user = repository.findById(id).orElse(null);
        if (user == null) {
            repository.save(new CabinetUser(id, role, studentId, parentKey, displayName, now));
            return;
        }
        user.setDisplayName(displayName);
        user.setLastSeenAt(now);
        repository.save(user);
    }

    private CabinetUserListItemDto toListItem(CabinetUser user) {
        return new CabinetUserListItemDto(
            user.getId(),
            user.getRole().name(),
            user.getStudentId(),
            user.getDisplayName(),
            user.getFirstLoginAt().toString(),
            user.getLastLoginAt().toString(),
            user.getLastSeenAt().toString()
        );
    }

    static String studentKey(String studentId) {
        return "student:" + studentId.trim();
    }

    static String parentKey(String studentId, int memberIndex) {
        return "parent:" + studentId.trim() + ":" + memberIndex;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
