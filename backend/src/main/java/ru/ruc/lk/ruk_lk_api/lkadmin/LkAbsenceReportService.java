package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.student.AttendanceMapper;
import ru.ruc.lk.ruk_lk_api.api.student.CampusLesson;
import ru.ruc.lk.ruk_lk_api.api.student.CampusSupport;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleMapper;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceLessonResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCFamilyResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoClient;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoException;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoHeadZones;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoKrasnodarZones;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoStaffMember;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleGroupLookupResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleGroupNameNormalizer;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioClient;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioEmpCodeResolver;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioEmployee;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioException;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceNoticeSendRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportStageTimingDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportSummaryDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterSaveRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.ParentNoticeRequest;

/**
 * Отчёт отсутствующих: Казань (ZKBio) и Краснодар (Perco, зоны {@code Краснодар-*}).
 * Асинхронное построение с сохранением в БД.
 */
@Service
public class LkAbsenceReportService {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportService.class);
    private static final DateTimeFormatter DATE_RU = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_DOT = DateTimeFormatter.ofPattern("HH.mm");
    private static final String SOURCE_ZKBIO = "zkbio";
    private static final String SOURCE_PERCO = "perco";
    private static final int EMP_CODE_LENGTH = 6;
    private static final int MAX_PARALLEL = 16;
    private static final Duration EMPLOYEES_CACHE_TTL = Duration.ofHours(6);

    private final ScheduleClient scheduleClient;
    private final OneCClient onecClient;
    private final ZKBioClient zkbioClient;
    private final PercoClient percoClient;
    private final LkGroupRosterRepository rosterRepository;
    private final LkAbsenceParentNoticeRepository noticeRepository;
    private final LkAbsenceReportRepository reportRepository;
    private final LkAbsenceNoticeService absenceNoticeService;
    private final LkAbsenceReportSettingsService settingsService;
    private final boolean percoEnabled;
    private final String percoUncontrolledZone;
    private final ExecutorService reportExecutor = Executors.newFixedThreadPool(2);
    private final AtomicReference<EmployeesCache> employeesCache = new AtomicReference<>();
    private final TransactionTemplate transactionTemplate;
    private final Set<UUID> cancelRequested = ConcurrentHashMap.newKeySet();
    private final ConcurrentHashMap<UUID, BuildTimingState> timingByReport = new ConcurrentHashMap<>();

    private static final class ReportCancelledException extends RuntimeException {
        ReportCancelledException() {
            super("Отчёт отменён");
        }
    }

    /** Накопление длительностей этапов во время RUNNING. */
    private static final class BuildTimingState {
        Instant buildStarted;
        String currentPhase;
        String currentLabel;
        Instant phaseStarted;
        final List<AbsenceReportStageTimingDto> completed = new ArrayList<>();
    }

    public LkAbsenceReportService(
        ScheduleClient scheduleClient,
        OneCClient onecClient,
        ZKBioClient zkbioClient,
        PercoClient percoClient,
        LkGroupRosterRepository rosterRepository,
        LkAbsenceParentNoticeRepository noticeRepository,
        LkAbsenceReportRepository reportRepository,
        LkAbsenceNoticeService absenceNoticeService,
        LkAbsenceReportSettingsService settingsService,
        PlatformTransactionManager transactionManager,
        @Value("${app.perco.enabled:false}") boolean percoEnabled,
        @Value("${app.perco.uncontrolled-zone:Неконтролируемая территория}") String percoUncontrolledZone
    ) {
        this.scheduleClient = scheduleClient;
        this.onecClient = onecClient;
        this.zkbioClient = zkbioClient;
        this.percoClient = percoClient;
        this.rosterRepository = rosterRepository;
        this.noticeRepository = noticeRepository;
        this.reportRepository = reportRepository;
        this.absenceNoticeService = absenceNoticeService;
        this.settingsService = settingsService;
        this.percoEnabled = percoEnabled;
        this.percoUncontrolledZone = percoUncontrolledZone == null || percoUncontrolledZone.isBlank()
            ? "Неконтролируемая территория"
            : percoUncontrolledZone.trim();
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @PreDestroy
    void shutdown() {
        reportExecutor.shutdownNow();
    }

    /** Старт асинхронного построения; сразу возвращает RUNNING. Только супер-админ. */
    @Transactional
    public AbsenceReportResponse start(HttpSession session, AbsenceReportRequest body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(body.campus());
        LkAdminAuthService.requireAbsenceCampus(session, campus);
        LkAdminAuthService.requireSuperAdmin(session);
        requireEnabled(campus);
        LocalDate date = parseDate(body.date());
        LocalDate today = LocalDate.now(ZoneId.of("Europe/Moscow"));
        if (date.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нельзя строить отчёт на будущую дату");
        }
        LkAbsenceReportScope scope = parseScope(body.scope());
        String filterGroup = "";
        if (scope == LkAbsenceReportScope.GROUP) {
            filterGroup = requireText(body.group(), "Укажите группу");
            precheckGroupSchedule(filterGroup, date);
        }
        return enqueue(date, LkAbsenceReportOrigin.MANUAL, scope, filterGroup, campus);
    }

    /**
     * Автозапуск на сегодня (МСК) для всех кампусов с эффективным {@code auto-enabled}.
     * Ручные отчёты за ту же дату не мешают. Только CAMPUS.
     */
    @Transactional
    public List<UUID> startAutoForTodayAll() {
        List<UUID> started = new ArrayList<>();
        for (LkAbsenceReportCampus campus : LkAbsenceReportCampus.values()) {
            startAutoForToday(campus).ifPresent(started::add);
        }
        return started;
    }

    /**
     * Автозапуск CAMPUS-отчёта на сегодня для одного кампуса.
     * Пропуск, если флаг/настройка выключены, СКУД недоступен или уже есть AUTO RUNNING/DONE.
     */
    @Transactional
    public Optional<UUID> startAutoForToday(LkAbsenceReportCampus campus) {
        if (campus == null) {
            return Optional.empty();
        }
        if (!settingsService.isEffectiveAuto(campus)) {
            log.info("Автоотчёт {} пропущен: auto выключен (флаг и/или админка)", campus);
            return Optional.empty();
        }
        try {
            requireEnabled(campus);
        } catch (ResponseStatusException e) {
            log.info("Автоотчёт {} пропущен: {}", campus, e.getReason());
            return Optional.empty();
        }
        LocalDate today = LocalDate.now(ZoneId.of("Europe/Moscow"));
        boolean alreadyAuto = reportRepository.findByReportDate(today).stream()
            .filter(e -> e.getScope() == LkAbsenceReportScope.CAMPUS)
            .filter(e -> e.getOrigin() == LkAbsenceReportOrigin.AUTO)
            .filter(e -> LkAbsenceReportCampus.fromSource(e.getSource()) == campus)
            .anyMatch(e -> e.getStatus() == LkAbsenceReportStatus.RUNNING
                || e.getStatus() == LkAbsenceReportStatus.DONE);
        if (alreadyAuto) {
            log.info("Автоотчёт {} пропущен: на {} уже есть AUTO RUNNING/DONE", campus, today);
            return Optional.empty();
        }
        AbsenceReportResponse started = enqueue(
            today,
            LkAbsenceReportOrigin.AUTO,
            LkAbsenceReportScope.CAMPUS,
            "",
            campus
        );
        log.info("Автоотчёт {} запущен: id={} date={}", campus, started.id(), today);
        return Optional.of(UUID.fromString(started.id()));
    }

    @Transactional
    public AbsenceReportResponse cancel(HttpSession session, UUID id) {
        LkAdminAuthService.requireSuperAdmin(session);
        // Сразу стопаем build-поток; запись в БД — следом.
        cancelRequested.add(id);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        LkAdminAuthService.requireAbsenceCampus(session, LkAbsenceReportCampus.fromSource(entity.getSource()));
        if (entity.getStatus() != LkAbsenceReportStatus.RUNNING
            && entity.getStatus() != LkAbsenceReportStatus.CANCELLED) {
            cancelRequested.remove(id);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Отчёт уже не строится");
        }
        if (entity.getStatus() == LkAbsenceReportStatus.CANCELLED) {
            return toResponse(entity, List.of(), splitWarnings(entity.getWarningsText()));
        }
        entity.setStatus(LkAbsenceReportStatus.CANCELLED);
        entity.setErrorMessage("Отменено пользователем");
        entity.setProgressPhase("cancelled");
        entity.setProgressLabel("Отменено");
        entity.setFinishedAt(Instant.now());
        reportRepository.save(entity);
        return toResponse(entity, List.of(), splitWarnings(entity.getWarningsText()));
    }

    private AbsenceReportResponse enqueue(
        LocalDate date,
        LkAbsenceReportOrigin origin,
        LkAbsenceReportScope scope,
        String filterGroup,
        LkAbsenceReportCampus campus
    ) {
        UUID id = UUID.randomUUID();
        LkAbsenceReportCampus resolved = campus == null ? LkAbsenceReportCampus.KRASNODAR : campus;
        LkAbsenceReportEntity entity = new LkAbsenceReportEntity(id, date, origin);
        entity.setScope(scope == null ? LkAbsenceReportScope.CAMPUS : scope);
        entity.setFilterGroup(filterGroup == null ? "" : filterGroup.trim());
        entity.setSource(resolved.sourceCode());
        entity.setCampusLabel(resolved.campusLabel());
        entity.setProgressPhase("queued");
        String queueLabel;
        if (origin == LkAbsenceReportOrigin.AUTO) {
            queueLabel = "Автоотчёт в очереди…";
        } else if (entity.getScope() == LkAbsenceReportScope.GROUP) {
            queueLabel = "Отчёт по группе в очереди…";
        } else {
            queueLabel = "Отчёт в очереди…";
        }
        entity.setProgressLabel(queueLabel);
        entity.setProgressPercent(1);
        reportRepository.save(entity);
        // Важно: runBuild только после commit, иначе другой поток не видит запись
        // и ensureNotCancelled ошибочно считает отчёт отменённым (RUNNING зависает на 1%).
        scheduleBuildAfterCommit(id, date);
        String runningLabel = origin == LkAbsenceReportOrigin.AUTO
            ? "Автоотчёт строится…"
            : entity.getScope() == LkAbsenceReportScope.GROUP
                ? "Отчёт по группе строится…"
                : "Отчёт строится…";
        return toResponse(entity, List.of(), List.of(runningLabel));
    }

    private void scheduleBuildAfterCommit(UUID id, LocalDate date) {
        Runnable job = () -> runBuild(id, date);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    reportExecutor.execute(job);
                }
            });
        } else {
            reportExecutor.execute(job);
        }
    }

    @Transactional(readOnly = true)
    public AbsenceReportResponse get(HttpSession session, UUID id) {
        LkAdminSession admin = LkAdminAuthService.require(session);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromSource(entity.getSource());
        LkAdminAuthService.requireAbsenceCampus(session, campus);
        if (!admin.superAdmin()) {
            requireVisibleDoneForViewer(entity, campus);
        }
        List<AbsenceReportRowDto> rows = entity.getStatus() == LkAbsenceReportStatus.DONE
            ? mapRows(entity)
            : List.of();
        List<String> warnings = splitWarnings(entity.getWarningsText());
        if (!admin.superAdmin()) {
            warnings = filterOutSummaryWarnings(warnings);
        }
        return toResponse(entity, rows, warnings);
    }

    /**
     * Готовый отчёт в .xlsx (те же строки, что в UI).
     * @return bytes + имя файла для Content-Disposition
     */
    @Transactional(readOnly = true)
    public AbsenceReportExcelFile exportExcel(HttpSession session, UUID id) {
        LkAdminSession admin = LkAdminAuthService.require(session);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromSource(entity.getSource());
        LkAdminAuthService.requireAbsenceCampus(session, campus);
        if (!admin.superAdmin()) {
            requireVisibleDoneForViewer(entity, campus);
        }
        if (entity.getStatus() != LkAbsenceReportStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Отчёт ещё не готов");
        }
        List<AbsenceReportRowDto> rows = mapRows(entity);
        int checked = entity.getCheckedCount() > 0 ? entity.getCheckedCount() : entity.getCandidateCount();
        byte[] bytes = LkAbsenceReportExcelExporter.build(
            entity.getReportDate().toString(),
            entity.getCampusLabel(),
            checked,
            entity.getAbsentCount(),
            rows
        );
        String filename = entity.getScope() == LkAbsenceReportScope.GROUP
            && !entity.getFilterGroup().isBlank()
            ? "absence-report-" + entity.getReportDate() + "-"
                + entity.getFilterGroup().replaceAll("[\\\\/:*?\"<>|]+", "_") + ".xlsx"
            : "absence-report-" + entity.getReportDate() + ".xlsx";
        return new AbsenceReportExcelFile(filename, bytes);
    }

    public record AbsenceReportExcelFile(String filename, byte[] content) {}

    @Transactional(readOnly = true)
    public List<AbsenceReportSummaryDto> list(HttpSession session, String campusRaw) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireAbsenceCampus(session, campus);
        LkAdminSession admin = LkAdminAuthService.require(session);
        String source = campus.sourceCode();
        if (!admin.superAdmin()) {
            return visibleDoneOnePerDate(campus).stream()
                .sorted(Comparator
                    .comparing(LkAbsenceReportEntity::getReportDate, Comparator.reverseOrder())
                    .thenComparing(this::finishInstant, Comparator.reverseOrder()))
                .map(this::toSummary)
                .toList();
        }
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(e -> e.getScope() == LkAbsenceReportScope.CAMPUS)
            .filter(e -> source.equalsIgnoreCase(e.getSource()))
            .map(this::toSummary)
            .toList();
    }

    /** Отчёты по одной группе — только супер-админ. */
    @Transactional(readOnly = true)
    public List<AbsenceReportSummaryDto> listGroupReports(HttpSession session, String campusRaw) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireAbsenceCampus(session, campus);
        LkAdminAuthService.requireSuperAdmin(session);
        String source = campus.sourceCode();
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(e -> e.getScope() == LkAbsenceReportScope.GROUP)
            .filter(e -> source.equalsIgnoreCase(e.getSource()))
            .map(this::toSummary)
            .toList();
    }

    /** Для обычных админов: только DONE CAMPUS своего кампуса, одна запись на дату (AUTO предпочтительнее). */
    private List<LkAbsenceReportEntity> visibleDoneOnePerDate(LkAbsenceReportCampus campus) {
        String source = campus.sourceCode();
        Map<LocalDate, LkAbsenceReportEntity> best = new LinkedHashMap<>();
        for (LkAbsenceReportEntity entity : reportRepository.findByStatus(LkAbsenceReportStatus.DONE)) {
            if (entity.getScope() == LkAbsenceReportScope.GROUP) {
                continue;
            }
            if (!source.equalsIgnoreCase(entity.getSource())) {
                continue;
            }
            LocalDate day = entity.getReportDate();
            LkAbsenceReportEntity current = best.get(day);
            if (current == null || isBetterDoneForViewer(entity, current)) {
                best.put(day, entity);
            }
        }
        return new ArrayList<>(best.values());
    }

    /**
     * AUTO важнее MANUAL; при равном типе — более поздний finishedAt/createdAt.
     */
    private boolean isBetterDoneForViewer(LkAbsenceReportEntity candidate, LkAbsenceReportEntity current) {
        boolean candAuto = candidate.getOrigin() == LkAbsenceReportOrigin.AUTO;
        boolean curAuto = current.getOrigin() == LkAbsenceReportOrigin.AUTO;
        if (candAuto != curAuto) {
            return candAuto;
        }
        return finishInstant(candidate).isAfter(finishInstant(current));
    }

    private Instant finishInstant(LkAbsenceReportEntity entity) {
        if (entity.getFinishedAt() != null) {
            return entity.getFinishedAt();
        }
        if (entity.getCreatedAt() != null) {
            return entity.getCreatedAt();
        }
        return Instant.EPOCH;
    }

    private void requireVisibleDoneForViewer(LkAbsenceReportEntity entity, LkAbsenceReportCampus campus) {
        if (entity.getScope() == LkAbsenceReportScope.GROUP) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден");
        }
        if (entity.getStatus() != LkAbsenceReportStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден");
        }
        boolean allowed = visibleDoneOnePerDate(campus).stream()
            .anyMatch(e -> e.getId().equals(entity.getId()));
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден");
        }
    }

    private AbsenceReportSummaryDto toSummary(LkAbsenceReportEntity e) {
        return new AbsenceReportSummaryDto(
            e.getId().toString(),
            e.getReportDate().toString(),
            e.getStatus().name(),
            e.getOrigin().name(),
            e.getScope().name(),
            e.getFilterGroup(),
            e.getCheckedCount(),
            e.getAbsentCount(),
            e.getCreatedAt() == null ? "" : e.getCreatedAt().toString(),
            e.getFinishedAt() == null ? "" : e.getFinishedAt().toString(),
            blank(e.getErrorMessage()),
            e.getBuildDurationMs()
        );
    }

    public List<GroupRosterDto> listRosters(HttpSession session) {
        LkAdminAuthService.requireAnyAbsenceReport(session);
        return rosterRepository.findAllByOrderByGroupNameAsc().stream()
            .map(this::toRosterDto)
            .collect(Collectors.toList());
    }

    public GroupRosterDto saveRoster(HttpSession session, GroupRosterSaveRequest body) {
        LkAdminAuthService.requireAnyAbsenceReport(session);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        String group = requireText(body.groupName(), "Укажите номер группы");
        List<String> ids = normalizeIds(body.studentIds());
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите хотя бы одну зачетную книжку");
        }
        return toRosterDto(saveRosterInternal(group, ids));
    }

    public GroupRosterDto getRoster(HttpSession session, String groupName) {
        LkAdminAuthService.requireAnyAbsenceReport(session);
        String group = requireText(groupName, "Укажите номер группы");
        return rosterRepository.findById(group)
            .map(this::toRosterDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Состав группы не сохранён"));
    }

    public Map<String, Object> setParentNotice(HttpSession session, ParentNoticeRequest body) {
        LkAdminAuthService.requireAnyAbsenceReport(session);
        LkAdminAuthService.requireSuperAdmin(session);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LocalDate date = parseDate(body.date());
        String studentId = requireText(body.studentId(), "Укажите зачетную книжку");
        LkAbsenceParentNoticeId id = new LkAbsenceParentNoticeId(date, studentId);
        LkAbsenceParentNotice row = noticeRepository.findById(id)
            .orElseGet(() -> new LkAbsenceParentNotice(date, studentId, body.notified()));
        row.setNotified(body.notified());
        noticeRepository.save(row);
        return Map.of("ok", true, "date", date.toString(), "studentId", studentId, "notified", body.notified());
    }

    /**
     * Ручная отправка PDF-уведомления по одной строке (только супер-админ).
     * Переотправка разрешена; галочка ставится только при успешной доставке.
     * ФИО берём из запроса (не грузим отчёт из БД — иначе LOB warnings вне транзакции).
     */
    public Map<String, Object> sendAbsenceNoticeOne(HttpSession session, AbsenceNoticeSendRequest body) {
        LkAdminAuthService.requireAnyAbsenceReport(session);
        LkAdminAuthService.requireSuperAdmin(session);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LocalDate date = parseDate(body.date());
        String studentId = requireText(body.studentId(), "Укажите зачетную книжку");
        String fullName = body.fullName() == null || body.fullName().isBlank()
            ? studentId
            : body.fullName().trim();

        LkAbsenceNoticeService.NotifyOutcome outcome =
            absenceNoticeService.notifyOneForced(
                date,
                studentId,
                fullName,
                body.kind(),
                body.absenceRange()
            );

        return switch (outcome) {
            case SENT -> Map.of(
                "ok", true,
                "date", date.toString(),
                "studentId", studentId,
                "notified", true
            );
            case NO_TEMPLATE -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Нет бланка уведомления для филиала/уровня студента (СПО/ВО)"
            );
            case NO_RECIPIENTS -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Не найден канал доставки: нет привязки MAX и email у получателя"
            );
            case DELIVERY_FAILED -> throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Не удалось отправить уведомление (MAX/email). Галочка не поставлена."
            );
        };
    }

    private void runBuild(UUID reportId, LocalDate date) {
        LkAbsenceReportScope scope = LkAbsenceReportScope.CAMPUS;
        String filterGroup = "";
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.KRASNODAR;
        try {
            LkAbsenceReportEntity meta = transactionTemplate.execute(status ->
                reportRepository.findById(reportId).orElse(null)
            );
            if (meta != null) {
                scope = meta.getScope();
                filterGroup = meta.getFilterGroup();
                campus = LkAbsenceReportCampus.fromSource(meta.getSource());
            }
            ensureNotCancelled(reportId);
            BuildResult result;
            if (campus == LkAbsenceReportCampus.KRASNODAR) {
                result = buildPercoCampus(reportId, date, filterGroup, LkAbsenceReportCampus.KRASNODAR);
            } else if (campus == LkAbsenceReportCampus.HEAD) {
                result = buildPercoCampus(reportId, date, filterGroup, LkAbsenceReportCampus.HEAD);
            } else if (campus == LkAbsenceReportCampus.KAZAN) {
                result = buildKazan(reportId, date, filterGroup);
            } else {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Неизвестный кампус отчёта"
                );
            }
            ensureNotCancelled(reportId);
            transactionTemplate.executeWithoutResult(status -> {
                LkAbsenceReportEntity entity = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalStateException("Отчёт исчез: " + reportId));
                if (entity.getStatus() != LkAbsenceReportStatus.RUNNING) {
                    return;
                }
                entity.setStatus(LkAbsenceReportStatus.DONE);
                entity.setZkbioTotal(result.zkbioTotal());
                entity.setCandidateCount(result.candidateCount());
                entity.setCheckedCount(result.checkedCount());
                entity.setAbsentCount(result.rows().size());
                entity.setWarningsText(String.join("\n", result.warnings()));
                entity.setErrorMessage(null);
                entity.setProgressPhase("done");
                entity.setProgressLabel("Готово");
                entity.setProgressPercent(100);
                entity.setProgressCurrent(result.checkedCount());
                entity.setProgressTotal(result.checkedCount());
                entity.setFinishedAt(Instant.now());
                applyFinalTimings(reportId, entity);
                List<LkAbsenceReportRowEntity> rowEntities = new ArrayList<>();
                for (AbsenceReportRowDto row : result.rows()) {
                    rowEntities.add(new LkAbsenceReportRowEntity(
                        UUID.randomUUID(),
                        row.date(),
                        row.group(),
                        row.studentId(),
                        row.fullName(),
                        row.phone(),
                        row.scheduleRange(),
                        row.absenceRange(),
                        row.kind()
                    ));
                }
                entity.replaceRows(rowEntities);
                reportRepository.save(entity);
            });
            log.info(
                "Absence report {}: DONE campus={} scope={} group={} checked={} absent={} punchesEmp={}",
                reportId,
                campus,
                scope,
                filterGroup,
                result.checkedCount(),
                result.rows().size(),
                result.punchEmpCodes()
            );
            // Авторассылка CAMPUS: флаг notify AND настройка админки для кампуса.
            if (scope == LkAbsenceReportScope.CAMPUS && settingsService.isEffectiveNotify(campus)) {
                try {
                    absenceNoticeService.notifyAfterReport(date, campus, result.rows());
                } catch (RuntimeException notifyError) {
                    log.warn(
                        "Absence report {}: рассылка уведомлений завершилась с ошибкой: {}",
                        reportId,
                        notifyError.toString()
                    );
                }
            } else if (scope == LkAbsenceReportScope.GROUP) {
                log.info("Absence report {}: групповой отчёт — авторассылка пропущена", reportId);
            } else {
                log.info(
                    "Absence report {}: кампус {} — авторассылка пропущена (флаг/админка)",
                    reportId,
                    campus
                );
            }
        } catch (ReportCancelledException e) {
            log.info("Absence report {}: CANCELLED", reportId);
            markCancelledIfRunning(reportId, "Отменено");
        } catch (CompletionException e) {
            if (e.getCause() instanceof ReportCancelledException) {
                log.info("Absence report {}: CANCELLED", reportId);
                markCancelledIfRunning(reportId, "Отменено");
            } else {
                log.warn("Absence report {} FAILED: {}", reportId, e.toString());
                markFailed(reportId, e.getCause() != null ? e.getCause() : e);
            }
        } catch (Exception e) {
            log.warn("Absence report {} FAILED: {}", reportId, e.toString());
            markFailed(reportId, e);
        } finally {
            cancelRequested.remove(reportId);
            timingByReport.remove(reportId);
        }
    }

    private void markCancelledIfRunning(UUID reportId, String label) {
        transactionTemplate.executeWithoutResult(status ->
            reportRepository.findById(reportId).ifPresent(entity -> {
                if (entity.getStatus() != LkAbsenceReportStatus.RUNNING) {
                    return;
                }
                entity.setStatus(LkAbsenceReportStatus.CANCELLED);
                entity.setErrorMessage("Отменено");
                entity.setProgressPhase("cancelled");
                entity.setProgressLabel(label == null || label.isBlank() ? "Отменено" : label);
                entity.setFinishedAt(Instant.now());
                applyFinalTimings(reportId, entity);
                reportRepository.save(entity);
            })
        );
    }

    private void markFailed(UUID reportId, Throwable e) {
        String message = e instanceof Exception ex ? shortMessage(ex) : String.valueOf(e);
        transactionTemplate.executeWithoutResult(status ->
            reportRepository.findById(reportId).ifPresent(entity -> {
                if (entity.getStatus() != LkAbsenceReportStatus.RUNNING) {
                    return;
                }
                entity.setStatus(LkAbsenceReportStatus.FAILED);
                entity.setErrorMessage(message);
                entity.setProgressPhase("failed");
                entity.setProgressLabel("Ошибка построения");
                entity.setFinishedAt(Instant.now());
                applyFinalTimings(reportId, entity);
                reportRepository.save(entity);
            })
        );
    }

    private BuildResult buildKazan(UUID reportId, LocalDate date, String filterGroup)
        throws ZKBioException {
        List<String> warnings = new ArrayList<>();
        boolean groupOnly = filterGroup != null && !filterGroup.isBlank();
        if (groupOnly) {
            warnings.add("Отчёт по группе: " + filterGroup.trim());
        }

        ensureNotCancelled(reportId);
        updateProgress(reportId, "employees", "Загрузка сотрудников ZKBio…", 5, 0, 0);
        List<ZKBioEmployee> employees = loadEmployeesCached();
        List<ZKBioEmployee> allUnique = uniqueByEmpCode(employees);
        List<RosterCandidate> roster = new ArrayList<>();
        int skippedNoGradebook = 0;
        for (ZKBioEmployee employee : allUnique) {
            Optional<String> gradebook = ZKBioEmpCodeResolver.resolveGradebookId(employee);
            if (gradebook.isEmpty() || employee.empCode() == null || employee.empCode().isBlank()) {
                skippedNoGradebook++;
                continue;
            }
            roster.add(new RosterCandidate(
                gradebook.get(),
                employee.empCode().trim(),
                employee.displayName()
            ));
        }
        if (skippedNoGradebook > 0) {
            warnings.add("Пропущено без зачётки (emp_code/nickname длины ≠ " + EMP_CODE_LENGTH + "): "
                + skippedNoGradebook + " из " + allUnique.size());
        }
        if (roster.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "В ZKBio нет сотрудников с emp_code или nickname длины " + EMP_CODE_LENGTH
            );
        }

        ensureNotCancelled(reportId);
        updateProgress(reportId, "punches", "Загрузка проходов ZKBio за день…", 12, 0, 0);
        Map<String, List<SkudAccessEvent>> punchesByEmp;
        try {
            // ConcurrentHashMap: параллельная догрузка по emp_code ниже.
            punchesByEmp = new ConcurrentHashMap<>(zkbioClient.fetchDayAccessEventsByEmpCode(date));
        } catch (ZKBioException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось получить проходы ZKBio за день: " + shortMessage(e)
            );
        }
        warnings.add("Проходов ZKBio за день: emp_code=" + punchesByEmp.size());

        return finishBuild(
            reportId,
            date,
            filterGroup,
            groupOnly,
            allUnique.size(),
            roster,
            punchesByEmp,
            LkAbsenceReportCampus.KAZAN,
            warnings
        );
    }

    private BuildResult buildPercoCampus(
        UUID reportId,
        LocalDate date,
        String filterGroup,
        LkAbsenceReportCampus campus
    ) {
        if (campus != LkAbsenceReportCampus.KRASNODAR && campus != LkAbsenceReportCampus.HEAD) {
            throw new IllegalArgumentException("buildPercoCampus: " + campus);
        }
        List<String> warnings = new ArrayList<>();
        boolean groupOnly = filterGroup != null && !filterGroup.isBlank();
        if (groupOnly) {
            warnings.add("Отчёт по группе: " + filterGroup.trim());
        }
        if (campus == LkAbsenceReportCampus.KRASNODAR) {
            warnings.add("Кампус: Краснодар (Perco, зоны Краснодар-*)");
        } else {
            warnings.add("Кампус: Голова (Perco, зоны без Краснодар-*)");
        }

        ensureNotCancelled(reportId);
        updateProgress(reportId, "employees", "Загрузка сотрудников Perco…", 5, 0, 0);
        List<PercoStaffMember> staff;
        try {
            staff = percoClient.fetchActiveStaffWithTabel();
        } catch (PercoException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось получить сотрудников Perco: " + shortMessage(e)
            );
        }
        Map<String, RosterCandidate> byTabel = new LinkedHashMap<>();
        int skippedNoTabel = 0;
        for (PercoStaffMember member : staff) {
            if (member == null) {
                continue;
            }
            String tabel = member.resolvedTabelNumber();
            if (tabel == null || tabel.isBlank()) {
                skippedNoTabel++;
                continue;
            }
            String key = tabel.trim();
            String display = member.fio() != null && !member.fio().isBlank()
                ? member.fio().trim()
                : (member.name() == null ? "" : member.name().trim());
            byTabel.putIfAbsent(key, new RosterCandidate(key, key, display));
        }
        if (skippedNoTabel > 0) {
            warnings.add("Пропущено без табельного в Perco: " + skippedNoTabel);
        }
        List<RosterCandidate> roster = List.copyOf(byTabel.values());
        if (roster.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "В Perco нет сотрудников с табельным номером"
            );
        }

        ensureNotCancelled(reportId);
        updateProgress(reportId, "punches", "Загрузка проходов Perco за день…", 12, 0, 0);
        Map<String, List<SkudAccessEvent>> punchesByTabel = new ConcurrentHashMap<>();
        String campusPunchLabel = campus == LkAbsenceReportCampus.HEAD ? "Голова" : "Краснодар";
        try {
            Map<String, List<PercoAccessEvent>> raw = percoClient.fetchAccessEventsByTabel(date, date);
            int rawStaff = raw.size();
            int keptEvents = 0;
            for (Map.Entry<String, List<PercoAccessEvent>> entry : raw.entrySet()) {
                String tabel = entry.getKey() == null ? "" : entry.getKey().trim();
                if (tabel.isEmpty()) {
                    continue;
                }
                List<SkudAccessEvent> mapped = mapPercoEventsForCampus(entry.getValue(), campus);
                if (!mapped.isEmpty()) {
                    punchesByTabel.put(tabel, mapped);
                    keptEvents += mapped.size();
                }
            }
            warnings.add("Проходов Perco (" + campusPunchLabel + "): табелей=" + punchesByTabel.size()
                + ", событий=" + keptEvents + " (сырой accessReports staff=" + rawStaff + ")");
            if (raw.isEmpty()) {
                warnings.add("accessReports пуст или недоступен — догрузка по табелю для кандидатов");
            }
        } catch (PercoException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось получить проходы Perco за день: " + shortMessage(e)
            );
        }

        return finishBuild(
            reportId,
            date,
            filterGroup,
            groupOnly,
            staff.size(),
            roster,
            punchesByTabel,
            campus,
            warnings
        );
    }

    private BuildResult finishBuild(
        UUID reportId,
        LocalDate date,
        String filterGroup,
        boolean groupOnly,
        int sourceTotal,
        List<RosterCandidate> roster,
        Map<String, List<SkudAccessEvent>> punchesByEmp,
        LkAbsenceReportCampus campus,
        List<String> warnings
    ) {
        EnrichStats enrichStats = new EnrichStats();
        ensureNotCancelled(reportId);
        updateProgress(
            reportId,
            "profiles",
            "Профили 1С: 0 / " + roster.size(),
            20,
            0,
            roster.size()
        );
        Map<String, EnrichedStudent> enriched = enrichStudents(reportId, roster, campus, enrichStats);
        if (enrichStats.noProfile > 0) {
            warnings.add("Нет профиля в 1С — пропуск: " + enrichStats.noProfile);
        }
        if (enrichStats.noGroup > 0) {
            warnings.add("Нет группы в 1С — пропуск: " + enrichStats.noGroup);
        }
        if (enrichStats.wrongCampus > 0) {
            warnings.add("Другой филиал в 1С — пропуск: " + enrichStats.wrongCampus);
        }
        if (enrichStats.notStudent > 0) {
            warnings.add("Не является студентом — пропуск: " + enrichStats.notStudent);
        }
        if (groupOnly) {
            String filter = filterGroup.trim();
            Map<String, EnrichedStudent> filtered = new LinkedHashMap<>();
            for (Map.Entry<String, EnrichedStudent> entry : enriched.entrySet()) {
                if (groupMatches(entry.getValue().group(), filter)) {
                    filtered.put(entry.getKey(), entry.getValue());
                }
            }
            warnings.add("После фильтра по группе «" + filter + "»: студентов=" + filtered.size()
                + " (из " + enriched.size() + " с профилем)");
            enriched = filtered;
        }
        if (enriched.isEmpty()) {
            warnings.add(groupOnly
                ? "В СКУД/1С не найдено студентов этой группы с профилем"
                : "После фильтрации не осталось студентов с профилем и группой в 1С");
            warnings.add(0, "Проверено студентов: 0 (кандидаты: " + roster.size() + ")");
            return new BuildResult(sourceTotal, roster.size(), 0, punchesByEmp.size(), List.of(), warnings);
        }

        Map<String, List<CampusLesson>> lessonsByGroup =
            loadLessonsByGroup(reportId, enriched, date, warnings);

        if (campus == LkAbsenceReportCampus.KAZAN) {
            recheckPunchesForAbsentees(reportId, date, enriched, lessonsByGroup, punchesByEmp, warnings);
        } else {
            recheckPercoPunchesForAbsentees(
                reportId, date, enriched, lessonsByGroup, punchesByEmp, warnings, campus
            );
        }

        ensureNotCancelled(reportId);
        updateProgress(reportId, "matching", "Сверка проходов с расписанием…", 93, 0, enriched.size());
        List<AbsenceReportRowDto> rows = new ArrayList<>();
        int matched = 0;
        for (EnrichedStudent student : enriched.values()) {
            ensureNotCancelled(reportId);
            matched++;
            try {
                AbsenceReportRowDto row = buildRow(date, student, lessonsByGroup, punchesByEmp, campus);
                if (row != null) {
                    rows.add(row);
                }
            } catch (Exception e) {
                warnings.add(student.studentId() + ": " + shortMessage(e));
            }
            if (matched == enriched.size() || matched % 50 == 0) {
                updateProgress(
                    reportId,
                    "matching",
                    "Сверка проходов с расписанием… " + matched + " / " + enriched.size(),
                    93 + (int) Math.round(6.0 * matched / Math.max(1, enriched.size())),
                    matched,
                    enriched.size()
                );
            }
        }
        rows.sort(Comparator
            .comparing(AbsenceReportRowDto::group, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(AbsenceReportRowDto::fullName, String.CASE_INSENSITIVE_ORDER));

        warnings.add(0, "Проверено студентов: " + enriched.size() + " (кандидаты: " + roster.size() + ")");

        return new BuildResult(
            sourceTotal,
            roster.size(),
            enriched.size(),
            punchesByEmp.size(),
            rows,
            warnings
        );
    }

    private List<ZKBioEmployee> loadEmployeesCached() throws ZKBioException {
        EmployeesCache cached = employeesCache.get();
        Instant now = Instant.now();
        if (cached != null && cached.loadedAt().plus(EMPLOYEES_CACHE_TTL).isAfter(now)
            && !cached.employees().isEmpty()) {
            return cached.employees();
        }
        List<ZKBioEmployee> fresh = zkbioClient.fetchEmployees();
        employeesCache.set(new EmployeesCache(List.copyOf(fresh), now));
        return fresh;
    }

    /**
     * Day-list без emp_code у ZKBio бывает дырявым. Кандидатов на отсутствие
     * (по bulk) перезапрашиваем по emp_code и подменяем проходы.
     */
    private void recheckPunchesForAbsentees(
        UUID reportId,
        LocalDate date,
        Map<String, EnrichedStudent> enriched,
        Map<String, List<CampusLesson>> lessonsByGroup,
        Map<String, List<SkudAccessEvent>> punchesByEmp,
        List<String> warnings
    ) {
        LinkedHashSet<String> empCodes = new LinkedHashSet<>();
        for (EnrichedStudent student : enriched.values()) {
            String emp = student.skudEmpCode();
            if (emp == null || emp.isBlank()) {
                continue;
            }
            try {
                if (buildRow(date, student, lessonsByGroup, punchesByEmp, LkAbsenceReportCampus.KAZAN) != null) {
                    empCodes.add(emp.trim());
                }
            } catch (Exception e) {
                empCodes.add(emp.trim());
            }
        }
        if (empCodes.isEmpty()) {
            warnings.add("Догрузка проходов ZKBio по emp_code: кандидатов=0");
            return;
        }

        List<String> codes = List.copyOf(empCodes);
        ensureNotCancelled(reportId);
        updateProgress(
            reportId,
            "recheck",
            "Догрузка проходов: 0 / " + codes.size(),
            88,
            0,
            codes.size()
        );

        AtomicInteger done = new AtomicInteger();
        AtomicInteger updated = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();
        try (ExecutorService pool = Executors.newFixedThreadPool(
            Math.min(MAX_PARALLEL, Math.max(1, codes.size()))
        )) {
            List<CompletableFuture<Void>> futures = new ArrayList<>(codes.size());
            for (String empCode : codes) {
                futures.add(CompletableFuture.runAsync(() -> {
                    ensureNotCancelled(reportId);
                    try {
                        List<SkudAccessEvent> fresh =
                            zkbioClient.fetchAccessEventsByEmpCode(empCode, date, date);
                        punchesByEmp.put(empCode, fresh == null ? List.of() : List.copyOf(fresh));
                        updated.incrementAndGet();
                    } catch (ReportCancelledException e) {
                        throw e;
                    } catch (Exception e) {
                        failed.incrementAndGet();
                        log.info("absence recheck emp_code={}: {}", empCode, e.getMessage());
                    } finally {
                        int n = done.incrementAndGet();
                        if (n == codes.size() || n % 25 == 0) {
                            int pct = 88 + (int) Math.round(4.0 * n / Math.max(1, codes.size()));
                            updateProgress(
                                reportId,
                                "recheck",
                                "Догрузка проходов: " + n + " / " + codes.size(),
                                pct,
                                n,
                                codes.size()
                            );
                        }
                    }
                }, pool));
            }
            try {
                CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
            } catch (CompletionException e) {
                Throwable cause = e.getCause() != null ? e.getCause() : e;
                if (cause instanceof ReportCancelledException cancelled) {
                    throw cancelled;
                }
                if (cause instanceof RuntimeException runtime) {
                    throw runtime;
                }
                throw e;
            }
        }

        String line = "Догрузка проходов ZKBio по emp_code: кандидатов=" + codes.size()
            + ", обновлено=" + updated.get();
        if (failed.get() > 0) {
            line += ", ошибок=" + failed.get();
        }
        warnings.add(line);
        log.info("Absence report {}: {}", reportId, line);
    }

    private void recheckPercoPunchesForAbsentees(
        UUID reportId,
        LocalDate date,
        Map<String, EnrichedStudent> enriched,
        Map<String, List<CampusLesson>> lessonsByGroup,
        Map<String, List<SkudAccessEvent>> punchesByTabel,
        List<String> warnings,
        LkAbsenceReportCampus campus
    ) {
        LinkedHashSet<String> tabels = new LinkedHashSet<>();
        for (EnrichedStudent student : enriched.values()) {
            String tabel = student.skudEmpCode();
            if (tabel == null || tabel.isBlank()) {
                continue;
            }
            try {
                if (buildRow(date, student, lessonsByGroup, punchesByTabel, campus) != null) {
                    tabels.add(tabel.trim());
                }
            } catch (Exception e) {
                tabels.add(tabel.trim());
            }
        }
        if (tabels.isEmpty()) {
            warnings.add("Догрузка проходов Perco по табелю: кандидатов=0");
            return;
        }

        List<String> codes = List.copyOf(tabels);
        ensureNotCancelled(reportId);
        updateProgress(
            reportId,
            "recheck",
            "Догрузка проходов Perco: 0 / " + codes.size(),
            88,
            0,
            codes.size()
        );

        AtomicInteger done = new AtomicInteger();
        AtomicInteger updated = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();
        try (ExecutorService pool = Executors.newFixedThreadPool(
            Math.min(MAX_PARALLEL, Math.max(1, codes.size()))
        )) {
            List<CompletableFuture<Void>> futures = new ArrayList<>(codes.size());
            for (String tabel : codes) {
                futures.add(CompletableFuture.runAsync(() -> {
                    ensureNotCancelled(reportId);
                    try {
                        List<SkudAccessEvent> fresh = mapPercoEventsForCampus(
                            percoClient.fetchAccessEvents(tabel, date, date),
                            campus
                        );
                        punchesByTabel.put(tabel, List.copyOf(fresh));
                        updated.incrementAndGet();
                    } catch (ReportCancelledException e) {
                        throw e;
                    } catch (Exception e) {
                        failed.incrementAndGet();
                        log.info("absence recheck perco tabel={}: {}", tabel, e.getMessage());
                    } finally {
                        int n = done.incrementAndGet();
                        if (n == codes.size() || n % 25 == 0) {
                            int pct = 88 + (int) Math.round(4.0 * n / Math.max(1, codes.size()));
                            updateProgress(
                                reportId,
                                "recheck",
                                "Догрузка проходов Perco: " + n + " / " + codes.size(),
                                pct,
                                n,
                                codes.size()
                            );
                        }
                    }
                }, pool));
            }
            try {
                CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
            } catch (CompletionException e) {
                Throwable cause = e.getCause() != null ? e.getCause() : e;
                if (cause instanceof ReportCancelledException cancelled) {
                    throw cancelled;
                }
                if (cause instanceof RuntimeException runtime) {
                    throw runtime;
                }
                throw e;
            }
        }

        String line = "Догрузка проходов Perco по табелю: кандидатов=" + codes.size()
            + ", обновлено=" + updated.get();
        if (failed.get() > 0) {
            line += ", ошибок=" + failed.get();
        }
        warnings.add(line);
        log.info("Absence report {}: {}", reportId, line);
    }

    private List<SkudAccessEvent> mapPercoEventsForCampus(
        List<PercoAccessEvent> events,
        LkAbsenceReportCampus campus
    ) {
        if (events == null || events.isEmpty()) {
            return List.of();
        }
        List<SkudAccessEvent> mapped = new ArrayList<>();
        for (PercoAccessEvent event : events) {
            if (event == null || event.resolvedTimeLabel() == null) {
                continue;
            }
            boolean keep = campus == LkAbsenceReportCampus.HEAD
                ? PercoHeadZones.involvesHead(event)
                : PercoKrasnodarZones.involvesKrasnodar(event);
            if (!keep) {
                continue;
            }
            var direction = event.resolveDirection(percoUncontrolledZone);
            mapped.add(new SkudAccessEvent(
                event.resolvedTimeLabel(),
                event.resolvedDisplayGate(direction),
                direction
            ));
        }
        return mapped;
    }

    private Map<String, EnrichedStudent> enrichStudents(
        UUID reportId,
        List<RosterCandidate> roster,
        LkAbsenceReportCampus campus,
        EnrichStats stats
    ) {
        Map<String, EnrichedStudent> result = new LinkedHashMap<>();
        int total = roster.size();
        AtomicInteger done = new AtomicInteger();
        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(MAX_PARALLEL, Math.max(1, total)))) {
            List<CompletableFuture<EnrichOutcome>> futures = new ArrayList<>();
            for (RosterCandidate candidate : roster) {
                futures.add(CompletableFuture.supplyAsync(() -> {
                    ensureNotCancelled(reportId);
                    EnrichOutcome outcome = enrichOne(candidate, campus);
                    int finished = done.incrementAndGet();
                    if (finished == total || finished % 100 == 0) {
                        int pct = 20 + (int) Math.round(40.0 * finished / Math.max(1, total));
                        updateProgress(
                            reportId,
                            "profiles",
                            "Профили 1С: " + finished + " / " + total,
                            pct,
                            finished,
                            total
                        );
                    }
                    return outcome;
                }, pool));
            }
            for (CompletableFuture<EnrichOutcome> future : futures) {
                ensureNotCancelled(reportId);
                EnrichOutcome outcome = future.join();
                if (outcome == null) {
                    continue;
                }
                switch (outcome.kind()) {
                    case NO_PROFILE -> stats.noProfile++;
                    case NO_GROUP -> stats.noGroup++;
                    case WRONG_CAMPUS -> stats.wrongCampus++;
                    case NOT_STUDENT -> stats.notStudent++;
                    case OK -> {
                        if (outcome.student() != null) {
                            result.put(outcome.student().studentId(), outcome.student());
                        }
                    }
                }
            }
        }
        return result;
    }

    private EnrichOutcome enrichOne(RosterCandidate candidate, LkAbsenceReportCampus campus) {
        String studentId = candidate.studentId();
        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        if (profile == null) {
            return EnrichOutcome.noProfile();
        }
        if (!isActiveStudentStatus(profile.status())) {
            return EnrichOutcome.notStudent();
        }
        if (campus == LkAbsenceReportCampus.KRASNODAR && !CampusSupport.isKrasnodar(profile)) {
            return EnrichOutcome.wrongCampus();
        }
        if (campus == LkAbsenceReportCampus.HEAD && !CampusSupport.isHead(profile)) {
            return EnrichOutcome.wrongCampus();
        }
        String group = profile.group() == null ? "" : profile.group().trim();
        if (group.isEmpty()) {
            return EnrichOutcome.noGroup();
        }
        String fullName = profile.fullName() != null && !profile.fullName().isBlank()
            ? profile.fullName().trim()
            : candidate.displayName();
        if (fullName == null || fullName.isBlank()) {
            fullName = studentId;
        }
        String parentContacts = formatParentContacts(onecClient.checkParent(studentId, null).orElse(null));
        return EnrichOutcome.ok(new EnrichedStudent(
            studentId,
            candidate.skudEmpCode(),
            fullName,
            parentContacts,
            group
        ));
    }

    /**
     * Контакты родителей из {@code /hs/student/parent/check}: телефоны с кратким родством.
     * Заказчики ({@code isCustomer}) идут первыми.
     */
    static String formatParentContacts(OneCFamilyResponse family) {
        if (family == null || !family.parentsFound() || family.parents() == null || family.parents().isEmpty()) {
            return "";
        }
        List<OneCParentMember> ordered = new ArrayList<>(family.parents());
        ordered.sort((a, b) -> Boolean.compare(b != null && b.isCustomer(), a != null && a.isCustomer()));

        LinkedHashSet<String> parts = new LinkedHashSet<>();
        for (OneCParentMember parent : ordered) {
            if (parent == null) {
                continue;
            }
            List<String> phones = parent.phones() == null ? List.of() : parent.phones().stream()
                .filter(p -> p != null && !p.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
            if (phones.isEmpty()) {
                continue;
            }
            String relation = parent.relation() == null ? "" : parent.relation().trim();
            String joined = String.join(", ", phones);
            parts.add(relation.isEmpty() ? joined : relation + ": " + joined);
        }
        if (parts.isEmpty()) {
            return "";
        }
        String text = String.join("; ", parts);
        return text.length() > 500 ? text.substring(0, 497) + "…" : text;
    }

    private Map<String, List<CampusLesson>> loadLessonsByGroup(
        UUID reportId,
        Map<String, EnrichedStudent> enriched,
        LocalDate date,
        List<String> warnings
    ) {
        Set<String> groups = enriched.values().stream()
            .map(EnrichedStudent::group)
            .filter(g -> g != null && !g.isBlank())
            .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<String, List<CampusLesson>> lessonsByGroup = new LinkedHashMap<>();
        int total = groups.size();
        int index = 0;
        for (String group : groups) {
            ensureNotCancelled(reportId);
            index++;
            int pct = 60 + (int) Math.round(30.0 * index / Math.max(1, total));
            updateProgress(
                reportId,
                "schedule",
                "Расписание групп: " + index + " / " + total,
                pct,
                index,
                total
            );
            try {
                List<CampusLesson> lessons = loadCampusLessons(group, date);
                lessonsByGroup.put(group, lessons);
                if (lessons.isEmpty()) {
                    warnings.add(group + ": нет очных пар на дату");
                }
            } catch (Exception e) {
                lessonsByGroup.put(group, List.of());
                warnings.add(group + ": " + shortMessage(e));
                log.info("absence report schedule {}: {}", group, e.getMessage());
            }
        }
        return lessonsByGroup;
    }

    private AbsenceReportRowDto buildRow(
        LocalDate date,
        EnrichedStudent student,
        Map<String, List<CampusLesson>> lessonsByGroup,
        Map<String, List<SkudAccessEvent>> punchesByEmp,
        LkAbsenceReportCampus campus
    ) {
        List<CampusLesson> dayLessons = lessonsByGroup.getOrDefault(student.group(), List.of());
        if (dayLessons.isEmpty()) {
            return null;
        }

        List<SkudAccessEvent> events = punchesByEmp.getOrDefault(student.skudEmpCode(), List.of());
        String source = campus == LkAbsenceReportCampus.KAZAN ? SOURCE_ZKBIO : SOURCE_PERCO;
        StudentAttendanceResponse attendance = AttendanceMapper.toResponse(source, events, dayLessons);
        List<StudentAttendanceLessonResponse> lessons = attendance.days().stream()
            .filter(d -> date.toString().equals(d.date()))
            .findFirst()
            .map(StudentAttendanceResponse.StudentAttendanceDayResponse::lessons)
            .orElse(List.of());

        List<StudentAttendanceLessonResponse> absent = lessons.stream()
            .filter(l -> AttendanceMapper.STATUS_ABSENT.equals(l.status()))
            .sorted(Comparator.comparing(StudentAttendanceLessonResponse::startTime))
            .toList();
        if (absent.isEmpty()) {
            return null;
        }

        List<StudentAttendanceLessonResponse> ordered = lessons.stream()
            .sorted(Comparator.comparing(StudentAttendanceLessonResponse::startTime))
            .toList();
        String scheduleRange = formatScheduleRange(dayLessons);
        boolean fullDay = absent.size() >= dayLessons.size();
        String kind = fullDay ? "full" : "partial";
        String absenceRange = fullDay
            ? "неявка на все пары"
            : formatLessonAttendanceDetail(ordered);
        boolean notified = noticeRepository
            .findByReportDateAndStudentId(date, student.studentId())
            .map(LkAbsenceParentNotice::isNotified)
            .orElse(false);

        return new AbsenceReportRowDto(
            date.format(DATE_RU),
            student.group(),
            student.studentId(),
            student.fullName(),
            student.phone(),
            scheduleRange,
            absenceRange,
            notified,
            kind
        );
    }

    private List<CampusLesson> loadCampusLessons(String group, LocalDate date) {
        ScheduleGroupLookupResponse lookup = lookupGroup(group)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа не найдена в сервисе расписания"
            ));
        if (lookup.group() == null || lookup.branch() == null
            || blank(lookup.group().guid()).isEmpty()
            || blank(lookup.branch().guid()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Группа не найдена в сервисе расписания");
        }
        ScheduleWeekApiResponse week = scheduleClient
            .fetchGroupWeek(lookup.branch().guid().trim(), lookup.group().guid().trim(), date)
            .orElse(null);
        if (week == null || week.schedule() == null) {
            return List.of();
        }
        List<CampusLesson> lessons = new ArrayList<>();
        for (var dayLessons : week.schedule().values()) {
            if (dayLessons == null) {
                continue;
            }
            for (var lesson : dayLessons) {
                if (lesson == null || !AttendanceMapper.isOnCampusClassroom(lesson.classroom())) {
                    continue;
                }
                LocalDate lessonDate = ScheduleMapper.parseApiDay(lesson.data());
                if (lessonDate == null || !lessonDate.equals(date)) {
                    continue;
                }
                LocalTime start = AttendanceMapper.parseLessonTime(lesson.timeStart());
                if (start == null) {
                    continue;
                }
                LocalTime end = AttendanceMapper.parseLessonTime(lesson.timeEnd());
                lessons.add(new CampusLesson(lessonDate, start, end, lesson.discipline(), lesson.classroom()));
            }
        }
        lessons.sort(Comparator.comparing(CampusLesson::start));
        return lessons;
    }

    private Optional<ScheduleGroupLookupResponse> lookupGroup(String groupName) {
        for (String candidate : ScheduleGroupNameNormalizer.lookupCandidates(groupName)) {
            Optional<ScheduleGroupLookupResponse> found = scheduleClient.lookupGroup(candidate);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private List<AbsenceReportRowDto> mapRows(LkAbsenceReportEntity entity) {
        LocalDate date = entity.getReportDate();
        List<AbsenceReportRowDto> rows = new ArrayList<>();
        for (LkAbsenceReportRowEntity row : entity.getRows()) {
            boolean notified = noticeRepository
                .findByReportDateAndStudentId(date, row.getStudentId())
                .map(LkAbsenceParentNotice::isNotified)
                .orElse(false);
            rows.add(new AbsenceReportRowDto(
                row.getDateLabel(),
                row.getGroupName(),
                row.getStudentId(),
                row.getFullName(),
                row.getPhone(),
                row.getScheduleRange(),
                row.getAbsenceRange(),
                notified,
                row.getKind()
            ));
        }
        return rows;
    }

    private AbsenceReportResponse toResponse(
        LkAbsenceReportEntity entity,
        List<AbsenceReportRowDto> rows,
        List<String> warnings
    ) {
        return new AbsenceReportResponse(
            entity.getId().toString(),
            entity.getStatus().name(),
            entity.getReportDate().toString(),
            entity.getCampusLabel(),
            "",
            entity.getCheckedCount() > 0 ? entity.getCheckedCount() : entity.getCandidateCount(),
            entity.getAbsentCount(),
            entity.getSource(),
            entity.getOrigin().name(),
            entity.getScope().name(),
            entity.getFilterGroup(),
            rows,
            warnings,
            blank(entity.getErrorMessage()),
            entity.getProgressPhase(),
            entity.getProgressLabel(),
            entity.getProgressPercent(),
            entity.getProgressCurrent(),
            entity.getProgressTotal(),
            entity.getBuildDurationMs(),
            parseStageTimings(entity.getTimingsJson())
        );
    }

    private void ensureNotCancelled(UUID reportId) {
        if (cancelRequested.contains(reportId)) {
            throw new ReportCancelledException();
        }
        Boolean cancelled = readCancelledFlag(reportId);
        if (cancelled == null) {
            // Редкая гонка до commit: подождём появления строки, не считаем отменой.
            for (int i = 0; i < 40 && cancelled == null; i++) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ReportCancelledException();
                }
                cancelled = readCancelledFlag(reportId);
            }
        }
        if (cancelled == null) {
            throw new IllegalStateException("Отчёт не найден после ожидания: " + reportId);
        }
        if (Boolean.TRUE.equals(cancelled)) {
            throw new ReportCancelledException();
        }
    }

    /** null — записи ещё нет; true/false — статус CANCELLED или нет. */
    private Boolean readCancelledFlag(UUID reportId) {
        return transactionTemplate.execute(status ->
            reportRepository.findById(reportId)
                .map(e -> e.getStatus() == LkAbsenceReportStatus.CANCELLED)
                .orElse(null)
        );
    }

    private void updateProgress(
        UUID reportId,
        String phase,
        String label,
        int percent,
        int current,
        int total
    ) {
        ensureNotCancelled(reportId);
        transactionTemplate.executeWithoutResult(status ->
            reportRepository.findById(reportId).ifPresent(entity -> {
                if (entity.getStatus() != LkAbsenceReportStatus.RUNNING) {
                    return;
                }
                entity.setProgressPhase(phase);
                entity.setProgressLabel(label);
                entity.setProgressPercent(percent);
                entity.setProgressCurrent(current);
                entity.setProgressTotal(total);
                applyProgressTiming(reportId, phase, label, entity);
                reportRepository.save(entity);
            })
        );
    }

    /**
     * При смене phase закрывает предыдущий этап; пишет частичные timings + wall-clock.
     * Потокобезопасно: profiles обновляется из пула.
     */
    private void applyProgressTiming(
        UUID reportId,
        String phase,
        String label,
        LkAbsenceReportEntity entity
    ) {
        if (phase == null || phase.isBlank()) {
            return;
        }
        BuildTimingState state = timingByReport.computeIfAbsent(reportId, ignored -> new BuildTimingState());
        synchronized (state) {
            Instant now = Instant.now();
            if (state.buildStarted == null) {
                state.buildStarted = now;
                state.currentPhase = phase;
                state.currentLabel = blankToPhaseLabel(phase, label);
                state.phaseStarted = now;
            } else if (!phase.equals(state.currentPhase)) {
                closeCurrentPhase(state, now);
                state.currentPhase = phase;
                state.currentLabel = blankToPhaseLabel(phase, label);
                state.phaseStarted = now;
            } else if (label != null && !label.isBlank()) {
                state.currentLabel = label.trim();
            }
            writeTimingsToEntity(state, entity, now, false);
        }
    }

    /** Закрывает текущий этап и фиксирует итог на entity (DONE / FAILED / CANCELLED). */
    private void applyFinalTimings(UUID reportId, LkAbsenceReportEntity entity) {
        BuildTimingState state = timingByReport.get(reportId);
        if (state == null) {
            return;
        }
        synchronized (state) {
            Instant now = Instant.now();
            closeCurrentPhase(state, now);
            writeTimingsToEntity(state, entity, now, true);
        }
    }

    private static void closeCurrentPhase(BuildTimingState state, Instant now) {
        if (state.currentPhase == null || state.phaseStarted == null) {
            return;
        }
        long ms = Math.max(0, Duration.between(state.phaseStarted, now).toMillis());
        state.completed.add(new AbsenceReportStageTimingDto(
            state.currentPhase,
            state.currentLabel == null || state.currentLabel.isBlank()
                ? state.currentPhase
                : state.currentLabel,
            ms
        ));
        state.currentPhase = null;
        state.currentLabel = null;
        state.phaseStarted = null;
    }

    private void writeTimingsToEntity(
        BuildTimingState state,
        LkAbsenceReportEntity entity,
        Instant now,
        boolean finalized
    ) {
        List<AbsenceReportStageTimingDto> snapshot = new ArrayList<>(state.completed);
        if (!finalized && state.currentPhase != null && state.phaseStarted != null) {
            long runningMs = Math.max(0, Duration.between(state.phaseStarted, now).toMillis());
            snapshot.add(new AbsenceReportStageTimingDto(
                state.currentPhase,
                state.currentLabel == null || state.currentLabel.isBlank()
                    ? state.currentPhase
                    : state.currentLabel,
                runningMs
            ));
        }
        entity.setTimingsJson(serializeStageTimings(snapshot));
        if (state.buildStarted != null) {
            entity.setBuildDurationMs(Math.max(0, Duration.between(state.buildStarted, now).toMillis()));
        }
    }

    private static String serializeStageTimings(List<AbsenceReportStageTimingDto> stages) {
        if (stages == null || stages.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder(stages.size() * 64);
        sb.append('[');
        for (int i = 0; i < stages.size(); i++) {
            AbsenceReportStageTimingDto stage = stages.get(i);
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"phase\":").append(jsonString(stage.phase()))
                .append(",\"label\":").append(jsonString(stage.label()))
                .append(",\"durationMs\":").append(Math.max(0, stage.durationMs()))
                .append('}');
        }
        sb.append(']');
        return sb.toString();
    }

    private static String jsonString(String raw) {
        if (raw == null) {
            return "\"\"";
        }
        StringBuilder sb = new StringBuilder(raw.length() + 8);
        sb.append('"');
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"' -> sb.append("\\\"");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
        return sb.toString();
    }

    private List<AbsenceReportStageTimingDto> parseStageTimings(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return List.of();
        }
        List<AbsenceReportStageTimingDto> out = new ArrayList<>();
        // Простой разбор массива наших объектов — без Jackson databind (Boot 4).
        String body = json.trim();
        if (!body.startsWith("[") || !body.endsWith("]")) {
            return List.of();
        }
        int i = 1;
        int n = body.length() - 1;
        while (i < n) {
            while (i < n && (body.charAt(i) == ',' || Character.isWhitespace(body.charAt(i)))) {
                i++;
            }
            if (i >= n || body.charAt(i) != '{') {
                break;
            }
            int end = findMatchingBrace(body, i);
            if (end < 0) {
                break;
            }
            String obj = body.substring(i, end + 1);
            String phase = extractJsonStringField(obj, "phase");
            String label = extractJsonStringField(obj, "label");
            Long ms = extractJsonLongField(obj, "durationMs");
            if (phase != null && ms != null) {
                out.add(new AbsenceReportStageTimingDto(
                    phase,
                    label == null || label.isBlank() ? phase : label,
                    Math.max(0, ms)
                ));
            }
            i = end + 1;
        }
        return List.copyOf(out);
    }

    private static int findMatchingBrace(String s, int openIdx) {
        int depth = 0;
        boolean inString = false;
        boolean escape = false;
        for (int i = openIdx; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inString) {
                if (escape) {
                    escape = false;
                } else if (c == '\\') {
                    escape = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }
            if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    private static String extractJsonStringField(String obj, String field) {
        String key = "\"" + field + "\"";
        int keyAt = obj.indexOf(key);
        if (keyAt < 0) {
            return null;
        }
        int colon = obj.indexOf(':', keyAt + key.length());
        if (colon < 0) {
            return null;
        }
        int i = colon + 1;
        while (i < obj.length() && Character.isWhitespace(obj.charAt(i))) {
            i++;
        }
        if (i >= obj.length() || obj.charAt(i) != '"') {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        i++;
        boolean escape = false;
        while (i < obj.length()) {
            char c = obj.charAt(i++);
            if (escape) {
                switch (c) {
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    case 'u' -> {
                        if (i + 4 <= obj.length()) {
                            try {
                                sb.append((char) Integer.parseInt(obj.substring(i, i + 4), 16));
                            } catch (NumberFormatException ignored) {
                                // skip bad escape
                            }
                            i += 4;
                        }
                    }
                    default -> sb.append(c);
                }
                escape = false;
                continue;
            }
            if (c == '\\') {
                escape = true;
            } else if (c == '"') {
                return sb.toString();
            } else {
                sb.append(c);
            }
        }
        return null;
    }

    private static Long extractJsonLongField(String obj, String field) {
        String key = "\"" + field + "\"";
        int keyAt = obj.indexOf(key);
        if (keyAt < 0) {
            return null;
        }
        int colon = obj.indexOf(':', keyAt + key.length());
        if (colon < 0) {
            return null;
        }
        int i = colon + 1;
        while (i < obj.length() && Character.isWhitespace(obj.charAt(i))) {
            i++;
        }
        int start = i;
        if (i < obj.length() && obj.charAt(i) == '-') {
            i++;
        }
        while (i < obj.length() && Character.isDigit(obj.charAt(i))) {
            i++;
        }
        if (start == i || (i == start + 1 && obj.charAt(start) == '-')) {
            return null;
        }
        try {
            return Long.parseLong(obj.substring(start, i));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String blankToPhaseLabel(String phase, String label) {
        if (label != null && !label.isBlank()) {
            return label.trim();
        }
        return phase == null ? "" : phase;
    }

    private void requireEnabled(LkAbsenceReportCampus campus) {
        if (campus == LkAbsenceReportCampus.KRASNODAR || campus == LkAbsenceReportCampus.HEAD) {
            if (!percoEnabled) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Perco отключён (app.perco.enabled)"
                );
            }
            return;
        }
        if (!zkbioClient.isEnabled()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "ZKBio Казань отключён (app.zkbio.kazan.enabled)"
            );
        }
    }

    private static List<ZKBioEmployee> uniqueByEmpCode(List<ZKBioEmployee> employees) {
        Map<String, ZKBioEmployee> unique = new LinkedHashMap<>();
        for (ZKBioEmployee employee : employees) {
            if (employee == null || employee.empCode() == null || employee.empCode().isBlank()) {
                continue;
            }
            unique.putIfAbsent(employee.empCode().trim(), employee);
        }
        return List.copyOf(unique.values());
    }

    private LkGroupRoster saveRosterInternal(String group, List<String> studentIds) {
        LkGroupRoster row = rosterRepository.findById(group)
            .orElseGet(() -> new LkGroupRoster(group, studentIds));
        row.setStudentIds(studentIds);
        row.touch();
        return rosterRepository.save(row);
    }

    private GroupRosterDto toRosterDto(LkGroupRoster row) {
        return new GroupRosterDto(
            row.getGroupName(),
            List.copyOf(row.getStudentIds()),
            row.getUpdatedAt() == null ? "" : row.getUpdatedAt().toString()
        );
    }

    private static String formatScheduleRange(List<CampusLesson> lessons) {
        if (lessons == null || lessons.isEmpty()) {
            return "";
        }
        LocalTime start = lessons.getFirst().start();
        LocalTime end = lessons.stream()
            .map(l -> l.end() != null ? l.end() : l.start().plusMinutes(90))
            .max(LocalTime::compareTo)
            .orElse(start);
        return start.format(TIME_DOT) + "-" + end.format(TIME_DOT);
    }

    /**
     * Разбор дня по парам в тех же формулировках, что раздел посещаемости.
     * Каждая пара — с новой строки. Пары «Вовремя» не включаем.
     */
    static String formatLessonAttendanceDetail(List<StudentAttendanceLessonResponse> lessons) {
        if (lessons == null || lessons.isEmpty()) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        int index = 0;
        for (StudentAttendanceLessonResponse lesson : lessons) {
            if (lesson == null) {
                continue;
            }
            if (AttendanceMapper.STATUS_PRESENT.equals(lesson.status())) {
                continue;
            }
            index++;
            String start = blank(lesson.startTime()).replace('.', ':');
            String end = blank(lesson.endTime()).replace('.', ':');
            String time = end.isEmpty() ? start : start + "–" + end;
            String status = attendanceStatusLabel(lesson.status(), lesson.lateMinutes(), lesson.arrivedAt());
            parts.add(index + ". " + time + " — " + status);
        }
        String text = String.join("\n", parts);
        return text.length() > 2000 ? text.substring(0, 1997) + "…" : text;
    }

    static String attendanceStatusLabel(String status, Integer lateMinutes, String arrivedAt) {
        if (AttendanceMapper.STATUS_LATE.equals(status)) {
            String label = "Опоздание";
            if (lateMinutes != null && lateMinutes > 0) {
                label += " · " + lateMinutes + " мин";
            }
            if (arrivedAt != null && !arrivedAt.isBlank()) {
                label += " · вход " + arrivedAt.trim();
            }
            return label;
        }
        if (AttendanceMapper.STATUS_ABSENT.equals(status)) {
            return "Неявка";
        }
        if (AttendanceMapper.STATUS_UNCONFIRMED.equals(status)) {
            return "Без выхода";
        }
        if (AttendanceMapper.STATUS_PRESENT.equals(status)) {
            String label = "Вовремя";
            if (arrivedAt != null && !arrivedAt.isBlank()) {
                label += " · вход " + arrivedAt.trim();
            }
            return label;
        }
        return "—";
    }

    private static List<String> normalizeIds(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String item : raw) {
            if (item == null) {
                continue;
            }
            for (String part : item.split("[,;\\s]+")) {
                String id = part.trim();
                if (!id.isEmpty()) {
                    unique.add(id);
                }
            }
        }
        return List.copyOf(unique);
    }

    private static List<String> splitWarnings(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return List.of(text.split("\\R"));
    }

    /** Сводка ZKBio/1С — только супер-админу; остальным не отдаём в API. */
    private static List<String> filterOutSummaryWarnings(List<String> warnings) {
        if (warnings == null || warnings.isEmpty()) {
            return List.of();
        }
        return warnings.stream().filter(line -> !isSummaryWarning(line)).toList();
    }

    private static boolean isSummaryWarning(String raw) {
        if (raw == null) {
            return false;
        }
        String line = raw.trim();
        return line.startsWith("Проверено студентов:")
            || line.startsWith("Пропущено по длине emp_code")
            || line.startsWith("Пропущено без зачётки")
            || line.startsWith("Проходов ZKBio")
            || line.startsWith("Проходов Perco")
            || line.startsWith("Догрузка проходов ZKBio")
            || line.startsWith("Догрузка проходов Perco")
            || line.startsWith("Кампус:")
            || line.startsWith("accessReports")
            || line.startsWith("Пропущено без табельного")
            || line.startsWith("Другой филиал в 1С")
            || line.startsWith("Отчёт по группе:")
            || line.startsWith("После фильтра по группе")
            || line.startsWith("Нет профиля в 1С")
            || line.startsWith("Нет группы в 1С")
            || line.startsWith("После фильтрации")
            || line.startsWith("В СКУД/1С не найдено");
    }

    /**
     * До старта GROUP-отчёта: группа есть в расписании и на дату есть очные пары.
     */
    private void precheckGroupSchedule(String groupName, LocalDate date) {
        Optional<ScheduleGroupLookupResponse> lookup;
        try {
            lookup = lookupGroup(groupName);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось проверить расписание: " + shortMessage(e)
            );
        }
        if (lookup.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Группа не найдена в расписании"
            );
        }
        List<CampusLesson> lessons;
        try {
            lessons = loadCampusLessons(groupName, date);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось загрузить расписание группы: " + shortMessage(e)
            );
        }
        if (lessons.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "На эту дату нет очных занятий у группы"
            );
        }
    }

    private static LkAbsenceReportScope parseScope(String raw) {
        if (raw == null || raw.isBlank()) {
            return LkAbsenceReportScope.CAMPUS;
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if ("GROUP".equals(value) || "GROUP_ONLY".equals(value) || "ONE".equals(value)) {
            return LkAbsenceReportScope.GROUP;
        }
        if ("CAMPUS".equals(value) || "ALL".equals(value) || "ALL_GROUPS".equals(value)) {
            return LkAbsenceReportScope.CAMPUS;
        }
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Некорректный вид отчёта (ожидается CAMPUS или GROUP)"
        );
    }

    /** Сопоставление группы из 1С с фильтром (с учётом нормализатора расписания). */
    static boolean groupMatches(String studentGroup, String filterGroup) {
        if (studentGroup == null || filterGroup == null) {
            return false;
        }
        String student = studentGroup.trim();
        String filter = filterGroup.trim();
        if (student.isEmpty() || filter.isEmpty()) {
            return false;
        }
        if (student.equalsIgnoreCase(filter)) {
            return true;
        }
        List<String> studentCandidates = ScheduleGroupNameNormalizer.lookupCandidates(student);
        List<String> filterCandidates = ScheduleGroupNameNormalizer.lookupCandidates(filter);
        for (String sc : studentCandidates) {
            for (String fc : filterCandidates) {
                if (sc != null && fc != null && sc.equalsIgnoreCase(fc)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите дату");
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректная дата (ожидается YYYY-MM-DD)");
        }
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private static String blank(String value) {
        return value == null ? "" : value.trim();
    }

    private static String shortMessage(Exception e) {
        if (e instanceof ResponseStatusException rse && rse.getReason() != null) {
            return rse.getReason();
        }
        if (e.getMessage() == null || e.getMessage().isBlank()) {
            return e.getClass().getSimpleName();
        }
        String msg = e.getMessage().trim();
        return msg.length() > 160 ? msg.substring(0, 157) + "…" : msg;
    }

    private record RosterCandidate(String studentId, String skudEmpCode, String displayName) {}

    private record EnrichedStudent(
        String studentId,
        String skudEmpCode,
        String fullName,
        String phone,
        String group
    ) {}

    private static final class EnrichStats {
        int noProfile;
        int noGroup;
        int wrongCampus;
        int notStudent;
    }

    private enum EnrichKind { OK, NO_PROFILE, NO_GROUP, WRONG_CAMPUS, NOT_STUDENT }

    private record EnrichOutcome(EnrichKind kind, EnrichedStudent student) {
        static EnrichOutcome ok(EnrichedStudent student) {
            return new EnrichOutcome(EnrichKind.OK, student);
        }

        static EnrichOutcome noProfile() {
            return new EnrichOutcome(EnrichKind.NO_PROFILE, null);
        }

        static EnrichOutcome noGroup() {
            return new EnrichOutcome(EnrichKind.NO_GROUP, null);
        }

        static EnrichOutcome wrongCampus() {
            return new EnrichOutcome(EnrichKind.WRONG_CAMPUS, null);
        }

        static EnrichOutcome notStudent() {
            return new EnrichOutcome(EnrichKind.NOT_STUDENT, null);
        }
    }

    /** В мониторинг только со статусом 1С «Является студентом». */
    private static boolean isActiveStudentStatus(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT).replace('\u00a0', ' ');
        return "является студентом".equals(normalized);
    }

    private record EmployeesCache(List<ZKBioEmployee> employees, Instant loadedAt) {}

    private record BuildResult(
        int zkbioTotal,
        int candidateCount,
        int checkedCount,
        int punchEmpCodes,
        List<AbsenceReportRowDto> rows,
        List<String> warnings
    ) {}
}
