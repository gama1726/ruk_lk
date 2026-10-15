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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.api.student.UniversityBranchCatalog;
import ru.ruc.lk.ruk_lk_api.api.student.UniversityBranchCatalog.Branch;
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
    private final JdbcTemplate jdbc;
    private final ConcurrentHashMap<String, Long> touchThrottle = new ConcurrentHashMap<>();

    public CabinetUserService(
        CabinetUserRepository repository,
        OneCClient onecClient,
        JdbcTemplate jdbc
    ) {
        this.repository = repository;
        this.onecClient = onecClient;
        this.jdbc = jdbc;
    }

    /**
     * Пишет факт входа без запроса в 1С: сеть/таймаут филиала не должны ломать статистику.
     * Филиал дозаполняет {@link #enrichStudentCampus(String)} / {@link #enrichParentCampus(String, int)}.
     */
    @Transactional
    public void recordStudentLogin(StudentSession student) {
        if (student == null || blank(student.studentId())) {
            return;
        }
        String id = studentKey(student.studentId());
        Instant now = Instant.now();
        String name = blank(student.fullName()) ? student.studentId().trim() : student.fullName().trim();
        String defaultCampus = UniversityBranchCatalog.MAIN.id();
        CabinetUser user = repository.findById(id).orElse(null);
        if (user == null) {
            // Сразу main — не «Не определён»; enrich уточнит филиал из 1С.
            repository.save(new CabinetUser(
                id,
                CabinetUserRole.STUDENT,
                student.studentId().trim(),
                null,
                name,
                defaultCampus,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        if (blank(user.getCampus()) || !UniversityBranchCatalog.isKnownId(user.getCampus())) {
            user.setCampus(defaultCampus);
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
        String name = blank(parent.parentFullName())
            ? ("Родитель · " + parent.studentId().trim())
            : parent.parentFullName().trim();
        String defaultCampus = UniversityBranchCatalog.MAIN.id();
        CabinetUser user = repository.findById(id).orElse(null);
        if (user == null) {
            repository.save(new CabinetUser(
                id,
                CabinetUserRole.PARENT,
                parent.studentId().trim(),
                String.valueOf(parent.memberIndex()),
                name,
                defaultCampus,
                now
            ));
            return;
        }
        user.setDisplayName(name);
        user.setLastLoginAt(now);
        user.setLastSeenAt(now);
        if (blank(user.getCampus()) || !UniversityBranchCatalog.isKnownId(user.getCampus())) {
            user.setCampus(defaultCampus);
        }
        repository.save(user);
    }

    /** Отдельная TX: сбой 1С не откатывает запись входа. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enrichStudentCampus(String studentId) {
        if (blank(studentId)) {
            return;
        }
        applyCampus(studentKey(studentId), studentId.trim());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enrichParentCampus(String studentId, int memberIndex) {
        if (blank(studentId)) {
            return;
        }
        applyCampus(parentKey(studentId, memberIndex), studentId.trim());
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
            total = repository.countByCampus(filter.campusId());
            online = repository.countByCampusAndLastSeenAtGreaterThanEqual(filter.campusId(), onlineSince);
            newInRange = repository.countByCampusAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                filter.campusId(),
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

        return new CabinetStatsResponse(
            total,
            online,
            newInRange,
            ONLINE_WINDOW_MINUTES,
            begin.toString(),
            end.toString(),
            series,
            buildCampusBreakdown(rangeStart, rangeEndExclusive, onlineSince)
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
        String campus = filter.mode() == CampusFilterMode.EXACT ? filter.campusId() : null;

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
     * Миграция старых кодов + обход null/OTHER через 1С.
     * @return число обновлённых строк
     */
    public int backfillCampuses() {
        int updated = 0;
        updated += migrateLegacyCodesWithoutOneC();
        updated += resolveMissingFromOneC();
        return updated;
    }

    private int migrateLegacyCodesWithoutOneC() {
        int updated = 0;
        for (CabinetUser user : repository.findAll()) {
            String current = user.getCampus();
            if (current == null || current.isBlank()) {
                continue;
            }
            if (UniversityBranchCatalog.isKnownId(current)) {
                continue;
            }
            String migrated = UniversityBranchCatalog.migrateLegacyCampusId(current);
            if (migrated != null && !migrated.equals(current)) {
                user.setCampus(migrated);
                repository.save(user);
                updated++;
            } else if (migrated == null) {
                // OTHER и неизвестное — сброс, чтобы забрать из 1С
                user.setCampus(null);
                repository.save(user);
                updated++;
            }
        }
        return updated;
    }

    private int resolveMissingFromOneC() {
        List<CabinetUser> missing = repository.findByCampusIsNull();
        if (missing.isEmpty()) {
            return 0;
        }
        // Не долбим 1С всей базой за один старт — остальное дозаполнится на входе.
        final int limit = 200;
        int updated = 0;
        Map<String, String> cache = new HashMap<>();
        for (CabinetUser user : missing) {
            if (updated >= limit) {
                log.info(
                    "Cabinet campus backfill: обработано {} из {} без филиала, продолжение на следующих стартах/входах",
                    updated,
                    missing.size()
                );
                break;
            }
            String campus = cache.computeIfAbsent(user.getStudentId(), this::resolveCampusId);
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
        for (Branch branch : UniversityBranchCatalog.all()) {
            long total = repository.countByCampus(branch.id());
            if (total == 0) {
                continue;
            }
            list.add(new CabinetCampusStatsDto(
                branch.id(),
                branch.label(),
                total,
                repository.countByCampusAndLastSeenAtGreaterThanEqual(branch.id(), onlineSince),
                repository.countByCampusAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
                    branch.id(),
                    rangeStart,
                    rangeEndExclusive
                )
            ));
        }
        long unknownTotal = repository.countByCampusIsNull();
        if (unknownTotal > 0) {
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
        CabinetUser existing = repository.findById(id).orElse(null);
        boolean needsCampus = existing == null
            || blank(existing.getCampus())
            || !UniversityBranchCatalog.isKnownId(existing.getCampus());

        // Филиал дозаполняем даже при throttle lastSeen — иначе «Не определён» залипает.
        if (needsCampus && existing != null) {
            try {
                applyCampus(id, studentId);
            } catch (RuntimeException e) {
                log.warn("Cabinet campus: touch enrich {} — {}", id, e.toString());
            }
        }

        long nowMs = System.currentTimeMillis();
        Long prev = touchThrottle.get(id);
        if (prev != null && nowMs - prev < TOUCH_THROTTLE_MS && existing != null) {
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
                UniversityBranchCatalog.MAIN.id(),
                now
            ));
            try {
                applyCampus(id, studentId);
            } catch (RuntimeException e) {
                log.warn("Cabinet campus: touch create enrich {} — {}", id, e.toString());
            }
            return;
        }
        user.setDisplayName(displayName);
        user.setLastSeenAt(now);
        if (blank(user.getCampus()) || !UniversityBranchCatalog.isKnownId(user.getCampus())) {
            user.setCampus(UniversityBranchCatalog.MAIN.id());
        }
        repository.save(user);
    }

    private void applyCampus(String userId, String studentId) {
        CabinetUser user = repository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Cabinet campus: пользователь {} не найден для enrich", userId);
            return;
        }
        String campus = resolveCampusId(studentId);
        if (blank(campus)) {
            campus = UniversityBranchCatalog.MAIN.id();
        }
        if (campus.equals(user.getCampus())) {
            return;
        }
        persistCampus(userId, campus);
    }

    private void persistCampus(String userId, String campus) {
        try {
            CabinetUser user = repository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }
            user.setCampus(campus);
            repository.saveAndFlush(user);
            log.info("Cabinet campus: {} → {}", userId, campus);
            return;
        } catch (RuntimeException e) {
            log.warn("Cabinet campus: JPA save {} → {} failed: {}", userId, campus, e.toString());
        }
        try {
            int n = jdbc.update("UPDATE cabinet_user SET campus = ? WHERE id = ?", campus, userId);
            if (n > 0) {
                log.info("Cabinet campus: JDBC {} → {}", userId, campus);
            } else {
                log.warn("Cabinet campus: JDBC update 0 строк для {}", userId);
            }
        } catch (RuntimeException e) {
            log.warn("Cabinet campus: JDBC save {} → {} failed: {}", userId, campus, e.toString(), e);
            throw e;
        }
    }

    private String resolveCampusId(String studentId) {
        if (blank(studentId)) {
            return UniversityBranchCatalog.MAIN.id();
        }
        try {
            OneCProfileResponse profile = onecClient.fetchProfile(studentId.trim()).orElse(null);
            return UniversityBranchCatalog.resolveFromProfile(profile).id();
        } catch (RuntimeException e) {
            log.warn("Не удалось определить филиал для {}: {}", studentId, e.toString());
            return UniversityBranchCatalog.MAIN.id();
        }
    }

    private CabinetUserListItemDto toListItem(CabinetUser user) {
        String campus = user.getCampus();
        return new CabinetUserListItemDto(
            user.getId(),
            user.getRole().name(),
            user.getStudentId(),
            user.getDisplayName(),
            campus,
            UniversityBranchCatalog.labelOf(campus),
            user.getFirstLoginAt().toString(),
            user.getLastLoginAt().toString(),
            user.getLastSeenAt().toString()
        );
    }

    private static CampusFilter parseCampusFilter(String raw) {
        if (raw == null || raw.isBlank()) {
            return new CampusFilter(CampusFilterMode.ALL, null);
        }
        String value = raw.trim().toLowerCase(Locale.ROOT);
        if ("unknown".equals(value) || "null".equals(value)) {
            return new CampusFilter(CampusFilterMode.UNKNOWN, null);
        }
        String migrated = UniversityBranchCatalog.migrateLegacyCampusId(value);
        String id = migrated != null ? migrated : value;
        if (!UniversityBranchCatalog.isKnownId(id)) {
            return new CampusFilter(CampusFilterMode.ALL, null);
        }
        return new CampusFilter(CampusFilterMode.EXACT, id);
    }

    private static boolean matchesCampusFilter(CabinetUser user, CampusFilter filter) {
        return switch (filter.mode()) {
            case ALL -> true;
            case UNKNOWN -> user.getCampus() == null;
            case EXACT -> filter.campusId().equals(user.getCampus());
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

    private record CampusFilter(CampusFilterMode mode, String campusId) {}
}
