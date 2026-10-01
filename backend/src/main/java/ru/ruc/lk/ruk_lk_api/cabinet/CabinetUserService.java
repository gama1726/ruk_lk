package ru.ruc.lk.ruk_lk_api.cabinet;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetCampusStatsDto;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetStatsDayDto;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetStatsResponse;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetUserListItemDto;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetUserPageResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

@Service
public class CabinetUserService {

    private static final Logger log = LoggerFactory.getLogger(CabinetUserService.class);
    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");
    private static final long TOUCH_THROTTLE_MS = 120_000L;
    private static final long ONLINE_WINDOW_MINUTES = 15L;

    private final CabinetUserRepository repository;
    private final OneCClient onecClient;
    private final ConcurrentHashMap<String, Long> touchThrottle = new ConcurrentHashMap<>();

    public CabinetUserService(CabinetUserRepository repository, OneCClient onecClient) {
        this.repository = repository;
        this.onecClient = onecClient;
    }

    @Transactional
    public void recordStudentLogin(StudentSession student) {
        if (student == null || blank(student.studentId())) {
            return;
        }
        String id = studentKey(student.studentId());
        Instant now = Instant.now();
        CabinetCampus campus = resolveCampus(student.studentId());
        String name = blank(student.fullName()) ? student.studentId().trim() : student.fullName().trim();
        CabinetUser user = repository.findById(id).orElse(null);
        if (user == null) {
            repository.save(new CabinetUser(
                id,
                CabinetUserRole.STUDENT,
                student.studentId().trim(),
                null,
                name,
                campus,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        if (campus != null) {
            user.setCampus(campus);
        }
        repository.save(user);
    }

    @Transactional
    public void recordParentLogin(ParentSession parent) {
        if (parent == null || blank(parent.studentId())) {
            return;
        }
        String id = parentKey(parent.studentId(), parent.memberIndex());
        Instant now = Instant.now();
        CabinetCampus campus = resolveCampus(parent.studentId());
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
                campus,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        if (campus != null) {
            user.setCampus(campus);
        }
        repository.save(user);
    }

    @Transactional
    public void touchStudent(StudentSession student) {
        if (student == null || blank(student.studentId())) {
            return;
        }
        touch(
            studentKey(student.studentId()),
            CabinetUserRole.STUDENT,
            student.studentId().trim(),
            null,
            blank(student.fullName()) ? student.studentId().trim() : student.fullName().trim()
        );
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
    public CabinetStatsResponse stats(LocalDate from, LocalDate to, String campusFilter) {
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

        CampusFilter filter = parseCampusFilter(campusFilter);
        long total;
        long online;
        long newInRange;
        if (filter.mode() == CampusFilterMode.ALL) {
            total = repository.count();
            online = repository.countByLastSeenAtGreaterThanEqual(onlineSince);
            newInRange = repository.countByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                rangeStart,
                rangeEndExclusive
            );
        } else if (filter.mode() == CampusFilterMode.UNKNOWN) {
            total = repository.countByCampusIsNull();
            online = repository.countByCampusIsNullAndLastSeenAtGreaterThanEqual(onlineSince);
            newInRange = repository.countByCampusIsNullAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                rangeStart,
                rangeEndExclusive
            );
        } else {
            total = repository.countByCampus(filter.campus());
            online = repository.countByCampusAndLastSeenAtGreaterThanEqual(filter.campus(), onlineSince);
            newInRange = repository.countByCampusAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                filter.campus(),
                rangeStart,
                rangeEndExclusive
            );
        }

        Map<LocalDate, long[]> byDay = new HashMap<>();
        for (CabinetUser user : repository.findByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
            rangeStart,
            rangeEndExclusive
        )) {
            if (!matchesCampusFilter(user, filter)) {
                continue;
            }
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

        List<CabinetCampusStatsDto> byCampus = buildCampusBreakdown(rangeStart, rangeEndExclusive, onlineSince);

        return new CabinetStatsResponse(
            total,
            online,
            newInRange,
            ONLINE_WINDOW_MINUTES,
            begin.toString(),
            end.toString(),
            series,
            byCampus
        );
    }

    @Transactional(readOnly = true)
    public CabinetUserPageResponse listUsers(
        int page,
        int size,
        String campusFilter,
        String roleFilter,
        String q
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        CampusFilter filter = parseCampusFilter(campusFilter);
        CabinetUserRole role = parseRole(roleFilter);
        String query = blank(q) ? null : q.trim();

        boolean campusUnknown = filter.mode() == CampusFilterMode.UNKNOWN;
        CabinetCampus campus = filter.mode() == CampusFilterMode.EXACT ? filter.campus() : null;
        // ALL: campus=null, campusUnknown=false → no campus predicate beyond OR short-circuit
        // For ALL we need campusUnknown=false and campus=null meaning "any campus including null"
        // Query: (:campusUnknown = true AND u.campus IS NULL OR :campusUnknown = false AND (:campus IS NULL OR u.campus = :campus))
        // When ALL: campusUnknown=false, campus=null → (:campus IS NULL OR ...) → true. Good.
        // When UNKNOWN: campusUnknown=true → campus IS NULL. Good.
        // When EXACT: campusUnknown=false, campus=X → u.campus = X. Good.

        Page<CabinetUser> result = repository.search(
            campus,
            campusUnknown,
            role,
            query,
            PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "firstLoginAt"))
        );
        return new CabinetUserPageResponse(
            result.getContent().stream().map(this::toListItem).toList(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages()
        );
    }

    /**
     * Обход пользователей без кампуса: профиль 1С → {@link CabinetCampus}.
     * @return число обновлённых строк
     */
    public int backfillCampuses() {
        List<CabinetUser> missing = repository.findByCampusIsNull();
        if (missing.isEmpty()) {
            return 0;
        }
        int updated = 0;
        Map<String, CabinetCampus> cache = new HashMap<>();
        for (CabinetUser user : missing) {
            String studentId = user.getStudentId();
            CabinetCampus campus = cache.computeIfAbsent(studentId, this::resolveCampusSafe);
            user.setCampus(campus);
            repository.save(user);
            updated++;
        }
        return updated;
    }

    private List<CabinetCampusStatsDto> buildCampusBreakdown(
        Instant rangeStart,
        Instant rangeEndExclusive,
        Instant onlineSince
    ) {
        List<CabinetCampusStatsDto> list = new ArrayList<>();
        for (CabinetCampus campus : CabinetCampus.values()) {
            list.add(new CabinetCampusStatsDto(
                campus.name(),
                campus.label(),
                repository.countByCampus(campus),
                repository.countByCampusAndLastSeenAtGreaterThanEqual(campus, onlineSince),
                repository.countByCampusAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                    campus,
                    rangeStart,
                    rangeEndExclusive
                )
            ));
        }
        long unknownTotal = repository.countByCampusIsNull();
        if (unknownTotal > 0
            || repository.countByCampusIsNullAndLastSeenAtGreaterThanEqual(onlineSince) > 0) {
            list.add(new CabinetCampusStatsDto(
                "UNKNOWN",
                "Не определён",
                unknownTotal,
                repository.countByCampusIsNullAndLastSeenAtGreaterThanEqual(onlineSince),
                repository.countByCampusIsNullAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                    rangeStart,
                    rangeEndExclusive
                )
            ));
        }
        return list;
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
            repository.save(new CabinetUser(
                id,
                role,
                studentId,
                parentKey,
                displayName,
                resolveCampus(studentId),
                now
            ));
            return;
        }
        user.setDisplayName(displayName);
        user.setLastSeenAt(now);
        if (user.getCampus() == null) {
            CabinetCampus campus = resolveCampus(studentId);
            if (campus != null) {
                user.setCampus(campus);
            }
        }
        repository.save(user);
    }

    private CabinetCampus resolveCampus(String studentId) {
        if (blank(studentId)) {
            return CabinetCampus.OTHER;
        }
        try {
            OneCProfileResponse profile = onecClient.fetchProfile(studentId.trim()).orElse(null);
            return CabinetCampus.fromProfile(profile);
        } catch (RuntimeException e) {
            log.debug("Не удалось определить кампус для {}: {}", studentId, e.toString());
            return CabinetCampus.OTHER;
        }
    }

    /** Для обхода: ошибка 1С → OTHER, чтобы не крутить бесконечно null. */
    private CabinetCampus resolveCampusSafe(String studentId) {
        return resolveCampus(studentId);
    }

    private CabinetUserListItemDto toListItem(CabinetUser user) {
        CabinetCampus campus = user.getCampus();
        return new CabinetUserListItemDto(
            user.getId(),
            user.getRole().name(),
            user.getStudentId(),
            user.getDisplayName(),
            campus == null ? null : campus.name(),
            campus == null ? "Не определён" : campus.label(),
            user.getFirstLoginAt().toString(),
            user.getLastLoginAt().toString(),
            user.getLastSeenAt().toString()
        );
    }

    private static CampusFilter parseCampusFilter(String raw) {
        if (raw == null || raw.isBlank()) {
            return new CampusFilter(CampusFilterMode.ALL, null);
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if ("UNKNOWN".equals(value) || "NULL".equals(value)) {
            return new CampusFilter(CampusFilterMode.UNKNOWN, null);
        }
        try {
            return new CampusFilter(CampusFilterMode.EXACT, CabinetCampus.valueOf(value));
        } catch (IllegalArgumentException e) {
            return new CampusFilter(CampusFilterMode.ALL, null);
        }
    }

    private static boolean matchesCampusFilter(CabinetUser user, CampusFilter filter) {
        return switch (filter.mode()) {
            case ALL -> true;
            case UNKNOWN -> user.getCampus() == null;
            case EXACT -> user.getCampus() == filter.campus();
        };
    }

    private static CabinetUserRole parseRole(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return CabinetUserRole.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
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

    private enum CampusFilterMode { ALL, EXACT, UNKNOWN }

    private record CampusFilter(CampusFilterMode mode, CabinetCampus campus) {}
}
