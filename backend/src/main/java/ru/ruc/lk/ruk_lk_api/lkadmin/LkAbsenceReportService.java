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
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleMapper;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceLessonResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCFamilyResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
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
 * Отчёт отсутствующих (Казань): массовые transactions за день + кэш employees,
 * асинхронное построение с сохранением в БД.
 */
@Service
public class LkAbsenceReportService {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportService.class);
    private static final DateTimeFormatter DATE_RU = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_DOT = DateTimeFormatter.ofPattern("HH.mm");
    private static final String SOURCE = "zkbio";
    private static final String CAMPUS_LABEL = "Казань (ZKBio)";
    private static final int EMP_CODE_LENGTH = 6;
    private static final int MAX_PARALLEL = 16;
    private static final Duration EMPLOYEES_CACHE_TTL = Duration.ofHours(6);

    private final ScheduleClient scheduleClient;
    private final OneCClient onecClient;
    private final ZKBioClient zkbioClient;
    private final LkGroupRosterRepository rosterRepository;
    private final LkAbsenceParentNoticeRepository noticeRepository;
    private final LkAbsenceReportRepository reportRepository;
    private final LkAbsenceNoticeService absenceNoticeService;
    private final boolean attendanceEnabled;
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
        LkGroupRosterRepository rosterRepository,
        LkAbsenceParentNoticeRepository noticeRepository,
        LkAbsenceReportRepository reportRepository,
        LkAbsenceNoticeService absenceNoticeService,
        PlatformTransactionManager transactionManager,
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled
    ) {
        this.scheduleClient = scheduleClient;
        this.onecClient = onecClient;
        this.zkbioClient = zkbioClient;
        this.rosterRepository = rosterRepository;
        this.noticeRepository = noticeRepository;
        this.reportRepository = reportRepository;
        this.absenceNoticeService = absenceNoticeService;
        this.attendanceEnabled = attendanceEnabled;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @PreDestroy
    void shutdown() {
        reportExecutor.shutdownNow();
    }

    /** Старт асинхронного построения; сразу возвращает RUNNING. Только супер-админ. */
    @Transactional
    public AbsenceReportResponse start(HttpSession session, AbsenceReportRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminAuthService.requireSuperAdmin(session);
        requireEnabled();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        return enqueue(parseDate(body.date()), LkAbsenceReportOrigin.MANUAL);
    }

    /**
     * Автозапуск на сегодня (МСК): если уже есть AUTO RUNNING/DONE на эту дату — пропуск.
     * Ручные отчёты за ту же дату не мешают.
     */
    @Transactional
    public Optional<UUID> startAutoForToday() {
        if (!attendanceEnabled || !zkbioClient.isEnabled()) {
            log.info("Автоотчёт отсутствующих пропущен: attendance/ZKBio выключены");
            return Optional.empty();
        }
        LocalDate today = LocalDate.now(ZoneId.of("Europe/Moscow"));
        boolean alreadyAuto = reportRepository.findByReportDate(today).stream()
            .filter(e -> e.getOrigin() == LkAbsenceReportOrigin.AUTO)
            .anyMatch(e -> e.getStatus() == LkAbsenceReportStatus.RUNNING
                || e.getStatus() == LkAbsenceReportStatus.DONE);
        if (alreadyAuto) {
            log.info("Автоотчёт отсутствующих пропущен: на {} уже есть AUTO RUNNING/DONE", today);
            return Optional.empty();
        }
        AbsenceReportResponse started = enqueue(today, LkAbsenceReportOrigin.AUTO);
        log.info("Автоотчёт отсутствующих запущен: id={} date={}", started.id(), today);
        return Optional.of(UUID.fromString(started.id()));
    }

    @Transactional
    public AbsenceReportResponse cancel(HttpSession session, UUID id) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminAuthService.requireSuperAdmin(session);
        // Сразу стопаем build-поток; запись в БД — следом.
        cancelRequested.add(id);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
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

    private AbsenceReportResponse enqueue(LocalDate date, LkAbsenceReportOrigin origin) {
        UUID id = UUID.randomUUID();
        LkAbsenceReportEntity entity = new LkAbsenceReportEntity(id, date, origin);
        entity.setProgressPhase("queued");
        entity.setProgressLabel(
            origin == LkAbsenceReportOrigin.AUTO ? "Автоотчёт в очереди…" : "Отчёт в очереди…"
        );
        entity.setProgressPercent(1);
        reportRepository.save(entity);
        // Важно: runBuild только после commit, иначе другой поток не видит запись
        // и ensureNotCancelled ошибочно считает отчёт отменённым (RUNNING зависает на 1%).
        scheduleBuildAfterCommit(id, date);
        return toResponse(entity, List.of(), List.of(
            origin == LkAbsenceReportOrigin.AUTO ? "Автоотчёт строится…" : "Отчёт строится…"
        ));
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
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminSession admin = LkAdminAuthService.require(session);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        if (!admin.superAdmin()) {
            requireVisibleDoneForViewer(entity);
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
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminSession admin = LkAdminAuthService.require(session);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        if (!admin.superAdmin()) {
            requireVisibleDoneForViewer(entity);
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
        String filename = "absence-report-" + entity.getReportDate() + ".xlsx";
        return new AbsenceReportExcelFile(filename, bytes);
    }

    public record AbsenceReportExcelFile(String filename, byte[] content) {}

    @Transactional(readOnly = true)
    public List<AbsenceReportSummaryDto> list(HttpSession session) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminSession admin = LkAdminAuthService.require(session);
        if (!admin.superAdmin()) {
            return visibleDoneOnePerDate().stream()
                .sorted(Comparator
                    .comparing(LkAbsenceReportEntity::getReportDate, Comparator.reverseOrder())
                    .thenComparing(this::finishInstant, Comparator.reverseOrder()))
                .map(this::toSummary)
                .toList();
        }
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toSummary)
            .toList();
    }

    /** Для обычных админов: только DONE, одна запись на дату (AUTO предпочтительнее). */
    private List<LkAbsenceReportEntity> visibleDoneOnePerDate() {
        Map<LocalDate, LkAbsenceReportEntity> best = new LinkedHashMap<>();
        for (LkAbsenceReportEntity entity : reportRepository.findByStatus(LkAbsenceReportStatus.DONE)) {
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

    private void requireVisibleDoneForViewer(LkAbsenceReportEntity entity) {
        if (entity.getStatus() != LkAbsenceReportStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден");
        }
        boolean allowed = visibleDoneOnePerDate().stream()
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
            e.getCheckedCount(),
            e.getAbsentCount(),
            e.getCreatedAt() == null ? "" : e.getCreatedAt().toString(),
            e.getFinishedAt() == null ? "" : e.getFinishedAt().toString(),
            blank(e.getErrorMessage()),
            e.getBuildDurationMs()
        );
    }

    public List<GroupRosterDto> listRosters(HttpSession session) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        return rosterRepository.findAllByOrderByGroupNameAsc().stream()
            .map(this::toRosterDto)
            .collect(Collectors.toList());
    }

    public GroupRosterDto saveRoster(HttpSession session, GroupRosterSaveRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
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
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        String group = requireText(groupName, "Укажите номер группы");
        return rosterRepository.findById(group)
            .map(this::toRosterDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Состав группы не сохранён"));
    }

    public Map<String, Object> setParentNotice(HttpSession session, ParentNoticeRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
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
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
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
        try {
            ensureNotCancelled(reportId);
            BuildResult result = buildInternal(reportId, date);
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
                "Absence report {}: DONE checked={} absent={} punchesEmp={}",
                reportId,
                result.checkedCount(),
                result.rows().size(),
                result.punchEmpCodes()
            );
            try {
                absenceNoticeService.notifyAfterReport(date, result.rows());
            } catch (RuntimeException notifyError) {
                log.warn(
                    "Absence report {}: рассылка уведомлений завершилась с ошибкой: {}",
                    reportId,
                    notifyError.toString()
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

    private BuildResult buildInternal(UUID reportId, LocalDate date) throws ZKBioException {
        List<String> warnings = new ArrayList<>();

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
            roster.add(new RosterCandidate(gradebook.get(), employee.empCode().trim(), employee));
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
        Map<String, EnrichedStudent> enriched = enrichStudents(reportId, roster, enrichStats);
        if (enrichStats.noProfile > 0) {
            warnings.add("Нет профиля в 1С — пропуск: " + enrichStats.noProfile);
        }
        if (enrichStats.noGroup > 0) {
            warnings.add("Нет группы в 1С — пропуск: " + enrichStats.noGroup);
        }
        if (enriched.isEmpty()) {
            warnings.add("После фильтрации не осталось студентов с профилем и группой в 1С");
            warnings.add(0, "Проверено студентов: 0 (кандидаты зачётки длины " + EMP_CODE_LENGTH
                + ": " + roster.size() + ")");
            return new BuildResult(allUnique.size(), roster.size(), 0, punchesByEmp.size(), List.of(), warnings);
        }

        Map<String, List<CampusLesson>> lessonsByGroup =
            loadLessonsByGroup(reportId, enriched, date, warnings);

        // Day-list ZKBio бывает неполным: перепроверяем тех, кого bulk пометил отсутствующими.
        recheckPunchesForAbsentees(reportId, date, enriched, lessonsByGroup, punchesByEmp, warnings);

        ensureNotCancelled(reportId);
        updateProgress(reportId, "matching", "Сверка проходов с расписанием…", 93, 0, enriched.size());
        List<AbsenceReportRowDto> rows = new ArrayList<>();
        int matched = 0;
        for (EnrichedStudent student : enriched.values()) {
            ensureNotCancelled(reportId);
            matched++;
            try {
                AbsenceReportRowDto row = buildRow(date, student, lessonsByGroup, punchesByEmp);
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

        warnings.add(0, "Проверено студентов: " + enriched.size() + " (кандидаты зачётки длины "
            + EMP_CODE_LENGTH + ": " + roster.size() + ")");

        return new BuildResult(
            allUnique.size(),
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
                if (buildRow(date, student, lessonsByGroup, punchesByEmp) != null) {
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

    private Map<String, EnrichedStudent> enrichStudents(
        UUID reportId,
        List<RosterCandidate> roster,
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
                    EnrichOutcome outcome = enrichOne(candidate);
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

    private EnrichOutcome enrichOne(RosterCandidate candidate) {
        String studentId = candidate.studentId();
        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        if (profile == null) {
            return EnrichOutcome.noProfile();
        }
        String group = profile.group() == null ? "" : profile.group().trim();
        if (group.isEmpty()) {
            return EnrichOutcome.noGroup();
        }
        String fullName = profile.fullName() != null && !profile.fullName().isBlank()
            ? profile.fullName().trim()
            : candidate.employee().displayName();
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
        Map<String, List<SkudAccessEvent>> punchesByEmp
    ) {
        List<CampusLesson> dayLessons = lessonsByGroup.getOrDefault(student.group(), List.of());
        if (dayLessons.isEmpty()) {
            return null;
        }

        List<SkudAccessEvent> events = punchesByEmp.getOrDefault(student.skudEmpCode(), List.of());
        StudentAttendanceResponse attendance = AttendanceMapper.toResponse(SOURCE, events, dayLessons);
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

    private void requireEnabled() {
        if (!attendanceEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Посещаемость отключена");
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
            || line.startsWith("Догрузка проходов ZKBio")
            || line.startsWith("Нет профиля в 1С")
            || line.startsWith("Нет группы в 1С")
            || line.startsWith("После фильтрации");
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

    private record RosterCandidate(String studentId, String skudEmpCode, ZKBioEmployee employee) {}

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
    }

    private enum EnrichKind { OK, NO_PROFILE, NO_GROUP }

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
