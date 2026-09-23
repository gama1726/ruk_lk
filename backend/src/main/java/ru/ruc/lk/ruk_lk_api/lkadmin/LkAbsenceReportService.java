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
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;
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
    private final boolean attendanceEnabled;
    private final ExecutorService reportExecutor = Executors.newFixedThreadPool(2);
    private final AtomicReference<EmployeesCache> employeesCache = new AtomicReference<>();
    private final TransactionTemplate transactionTemplate;
    private final Set<UUID> cancelRequested = ConcurrentHashMap.newKeySet();

    private static final class ReportCancelledException extends RuntimeException {
        ReportCancelledException() {
            super("Отчёт отменён");
        }
    }

    public LkAbsenceReportService(
        ScheduleClient scheduleClient,
        OneCClient onecClient,
        ZKBioClient zkbioClient,
        LkGroupRosterRepository rosterRepository,
        LkAbsenceParentNoticeRepository noticeRepository,
        LkAbsenceReportRepository reportRepository,
        PlatformTransactionManager transactionManager,
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled
    ) {
        this.scheduleClient = scheduleClient;
        this.onecClient = onecClient;
        this.zkbioClient = zkbioClient;
        this.rosterRepository = rosterRepository;
        this.noticeRepository = noticeRepository;
        this.reportRepository = reportRepository;
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
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
        if (entity.getStatus() != LkAbsenceReportStatus.RUNNING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Отчёт уже не строится");
        }
        cancelRequested.add(id);
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
        reportExecutor.execute(() -> runBuild(id, date));
        return toResponse(entity, List.of(), List.of(
            origin == LkAbsenceReportOrigin.AUTO ? "Автоотчёт строится…" : "Отчёт строится…"
        ));
    }

    @Transactional(readOnly = true)
    public AbsenceReportResponse get(HttpSession session, UUID id) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        LkAdminSession admin = LkAdminAuthService.require(session);
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
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
        LkAbsenceReportEntity entity = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Отчёт не найден"));
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
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(e -> new AbsenceReportSummaryDto(
                e.getId().toString(),
                e.getReportDate().toString(),
                e.getStatus().name(),
                e.getOrigin().name(),
                e.getCheckedCount(),
                e.getAbsentCount(),
                e.getCreatedAt() == null ? "" : e.getCreatedAt().toString(),
                e.getFinishedAt() == null ? "" : e.getFinishedAt().toString(),
                blank(e.getErrorMessage())
            ))
            .toList();
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
        } catch (ReportCancelledException e) {
            log.info("Absence report {}: CANCELLED", reportId);
        } catch (CompletionException e) {
            if (e.getCause() instanceof ReportCancelledException) {
                log.info("Absence report {}: CANCELLED", reportId);
            } else {
                log.warn("Absence report {} FAILED: {}", reportId, e.toString());
                markFailed(reportId, e.getCause() != null ? e.getCause() : e);
            }
        } catch (Exception e) {
            log.warn("Absence report {} FAILED: {}", reportId, e.toString());
            markFailed(reportId, e);
        } finally {
            cancelRequested.remove(reportId);
        }
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
            punchesByEmp = zkbioClient.fetchDayAccessEventsByEmpCode(date);
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

        ensureNotCancelled(reportId);
        updateProgress(reportId, "matching", "Сверка проходов с расписанием…", 92, 0, enriched.size());
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
                    92 + (int) Math.round(7.0 * matched / Math.max(1, enriched.size())),
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
        String absenceRange = formatLessonAttendanceDetail(ordered);
        boolean fullDay = absent.size() >= dayLessons.size();
        String kind = fullDay ? "full" : "partial";
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
            entity.getProgressTotal()
        );
    }

    private void ensureNotCancelled(UUID reportId) {
        if (cancelRequested.contains(reportId)) {
            throw new ReportCancelledException();
        }
        Boolean cancelled = transactionTemplate.execute(status ->
            reportRepository.findById(reportId)
                .map(e -> e.getStatus() == LkAbsenceReportStatus.CANCELLED)
                .orElse(true)
        );
        if (Boolean.TRUE.equals(cancelled)) {
            throw new ReportCancelledException();
        }
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
                reportRepository.save(entity);
            })
        );
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
     * В отчёт попадает только если была хотя бы одна неявка ({@code absent}).
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
            index++;
            String start = blank(lesson.startTime()).replace('.', ':');
            String end = blank(lesson.endTime()).replace('.', ':');
            String time = end.isEmpty() ? start : start + "–" + end;
            String status = attendanceStatusLabel(lesson.status(), lesson.lateMinutes(), lesson.arrivedAt());
            parts.add(index + ". " + time + " — " + status);
        }
        String text = String.join("; ", parts);
        return text.length() > 1000 ? text.substring(0, 997) + "…" : text;
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
