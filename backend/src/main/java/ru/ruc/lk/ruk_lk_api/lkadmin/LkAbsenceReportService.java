package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.student.AttendanceMapper;
import ru.ruc.lk.ruk_lk_api.api.student.CampusLesson;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleContextService;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleMapper;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleSessionContext;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceLessonResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioClient;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioEmployee;
import ru.ruc.lk.ruk_lk_api.integration.zkbio.ZKBioException;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterSaveRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.ParentNoticeRequest;

/**
 * Отчёт отсутствующих для Казани: полный справочник ZKBio,
 * кандидаты с emp_code длины 6, профиль/группа из 1С, пары из расписания,
 * проходы ZKBio — та же логика, что раздел посещаемости.
 */
@Service
public class LkAbsenceReportService {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportService.class);
    private static final DateTimeFormatter DATE_RU = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_DOT = DateTimeFormatter.ofPattern("HH.mm");
    private static final String SOURCE = "zkbio";
    private static final String CAMPUS_LABEL = "Казань (ZKBio)";
    private static final int EMP_CODE_LENGTH = 6;
    private static final int MAX_PARALLEL = 12;

    private final ScheduleContextService scheduleContextService;
    private final ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient scheduleClient;
    private final OneCClient onecClient;
    private final ZKBioClient zkbioClient;
    private final LkGroupRosterRepository rosterRepository;
    private final LkAbsenceParentNoticeRepository noticeRepository;
    private final boolean attendanceEnabled;

    public LkAbsenceReportService(
        ScheduleContextService scheduleContextService,
        ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient scheduleClient,
        OneCClient onecClient,
        ZKBioClient zkbioClient,
        LkGroupRosterRepository rosterRepository,
        LkAbsenceParentNoticeRepository noticeRepository,
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled
    ) {
        this.scheduleContextService = scheduleContextService;
        this.scheduleClient = scheduleClient;
        this.onecClient = onecClient;
        this.zkbioClient = zkbioClient;
        this.rosterRepository = rosterRepository;
        this.noticeRepository = noticeRepository;
        this.attendanceEnabled = attendanceEnabled;
    }

    public AbsenceReportResponse build(HttpSession session, AbsenceReportRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        if (!attendanceEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Посещаемость отключена");
        }
        if (!zkbioClient.isEnabled()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "ZKBio Казань отключён (app.zkbio.kazan.enabled)"
            );
        }
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LocalDate date = parseDate(body.date());

        List<ZKBioEmployee> employees;
        try {
            employees = zkbioClient.fetchEmployees();
        } catch (ZKBioException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось получить список студентов из ZKBio: " + shortMessage(e)
            );
        }

        List<ZKBioEmployee> allUnique = uniqueByEmpCode(employees);
        List<ZKBioEmployee> roster = allUnique.stream()
            .filter(e -> e.empCode() != null && e.empCode().trim().length() == EMP_CODE_LENGTH)
            .toList();
        int skippedByLength = allUnique.size() - roster.size();
        if (roster.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "В ZKBio нет сотрудников с emp_code длины " + EMP_CODE_LENGTH
            );
        }

        List<String> warnings = new ArrayList<>();
        if (skippedByLength > 0) {
            warnings.add(
                "Пропущено по длине emp_code ≠ " + EMP_CODE_LENGTH + ": " + skippedByLength
                    + " из " + allUnique.size()
            );
        }

        EnrichStats enrichStats = new EnrichStats();
        Map<String, EnrichedStudent> enriched = enrichStudents(roster, enrichStats);
        if (enrichStats.noProfile > 0) {
            warnings.add("Нет профиля в 1С — пропуск: " + enrichStats.noProfile);
        }
        if (enrichStats.noGroup > 0) {
            warnings.add("Нет группы в 1С — пропуск: " + enrichStats.noGroup);
        }
        if (enriched.isEmpty()) {
            warnings.add("После фильтрации не осталось студентов с профилем и группой в 1С");
            return new AbsenceReportResponse(
                date.toString(),
                CAMPUS_LABEL,
                "",
                roster.size(),
                0,
                SOURCE,
                List.of(),
                warnings
            );
        }

        Map<String, List<CampusLesson>> lessonsByGroup = loadLessonsByGroup(session, enriched, date, warnings);

        List<AbsenceReportRowDto> rows = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(MAX_PARALLEL, Math.max(1, enriched.size())))) {
            List<CompletableFuture<AbsenceReportRowDto>> futures = new ArrayList<>();
            for (EnrichedStudent student : enriched.values()) {
                futures.add(CompletableFuture.supplyAsync(
                    () -> buildRowSafe(date, student, lessonsByGroup, warnings),
                    pool
                ));
            }
            for (CompletableFuture<AbsenceReportRowDto> future : futures) {
                AbsenceReportRowDto row = future.join();
                if (row != null) {
                    rows.add(row);
                }
            }
        }

        rows.sort(Comparator
            .comparing(AbsenceReportRowDto::group, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(AbsenceReportRowDto::fullName, String.CASE_INSENSITIVE_ORDER));

        warnings.add(0, "Проверено студентов: " + enriched.size() + " (кандидаты emp_code длины "
            + EMP_CODE_LENGTH + ": " + roster.size() + ")");

        return new AbsenceReportResponse(
            date.toString(),
            CAMPUS_LABEL,
            "",
            enriched.size(),
            rows.size(),
            SOURCE,
            rows,
            warnings
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите хотя бы одну зачётку");
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
        String studentId = requireText(body.studentId(), "Укажите зачётку");
        LkAbsenceParentNoticeId id = new LkAbsenceParentNoticeId(date, studentId);
        LkAbsenceParentNotice row = noticeRepository.findById(id)
            .orElseGet(() -> new LkAbsenceParentNotice(date, studentId, body.notified()));
        row.setNotified(body.notified());
        noticeRepository.save(row);
        return Map.of("ok", true, "date", date.toString(), "studentId", studentId, "notified", body.notified());
    }

    private Map<String, EnrichedStudent> enrichStudents(List<ZKBioEmployee> roster, EnrichStats stats) {
        Map<String, EnrichedStudent> result = new LinkedHashMap<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(MAX_PARALLEL, Math.max(1, roster.size())))) {
            List<CompletableFuture<EnrichOutcome>> futures = new ArrayList<>();
            for (ZKBioEmployee employee : roster) {
                futures.add(CompletableFuture.supplyAsync(() -> enrichOne(employee), pool));
            }
            for (CompletableFuture<EnrichOutcome> future : futures) {
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

    private EnrichOutcome enrichOne(ZKBioEmployee employee) {
        String empCode = employee.empCode() == null ? "" : employee.empCode().trim();
        if (empCode.length() != EMP_CODE_LENGTH) {
            return null;
        }
        OneCProfileResponse profile = onecClient.fetchProfile(empCode).orElse(null);
        if (profile == null) {
            return EnrichOutcome.noProfile();
        }
        String group = profile.group() == null ? "" : profile.group().trim();
        if (group.isEmpty()) {
            return EnrichOutcome.noGroup();
        }
        String fullName = profile.fullName() != null && !profile.fullName().isBlank()
            ? profile.fullName().trim()
            : employee.displayName();
        if (fullName == null || fullName.isBlank()) {
            fullName = empCode;
        }
        String phone = profile.phone() != null ? profile.phone().trim() : "";
        return EnrichOutcome.ok(new EnrichedStudent(empCode, fullName, phone, group));
    }

    private Map<String, List<CampusLesson>> loadLessonsByGroup(
        HttpSession session,
        Map<String, EnrichedStudent> enriched,
        LocalDate date,
        List<String> warnings
    ) {
        Set<String> groups = enriched.values().stream()
            .map(EnrichedStudent::group)
            .filter(g -> g != null && !g.isBlank())
            .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<String, List<CampusLesson>> lessonsByGroup = new LinkedHashMap<>();
        for (String group : groups) {
            try {
                List<CampusLesson> lessons = loadCampusLessons(session, group, date);
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

    private AbsenceReportRowDto buildRowSafe(
        LocalDate date,
        EnrichedStudent student,
        Map<String, List<CampusLesson>> lessonsByGroup,
        List<String> warnings
    ) {
        try {
            return buildRow(date, student, lessonsByGroup);
        } catch (Exception e) {
            synchronized (warnings) {
                warnings.add(student.studentId() + ": " + shortMessage(e));
            }
            log.info("absence report student {}: {}", student.studentId(), e.getMessage());
            return null;
        }
    }

    private AbsenceReportRowDto buildRow(
        LocalDate date,
        EnrichedStudent student,
        Map<String, List<CampusLesson>> lessonsByGroup
    ) throws ZKBioException {
        List<CampusLesson> dayLessons = lessonsByGroup.getOrDefault(student.group(), List.of());
        if (dayLessons.isEmpty()) {
            return null;
        }

        List<SkudAccessEvent> events = zkbioClient.fetchAccessEventsByEmpCode(student.studentId(), date, date);
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

        String scheduleRange = formatScheduleRange(dayLessons);
        String absenceRange = mergeAbsenceRanges(absent);
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

    private List<CampusLesson> loadCampusLessons(HttpSession session, String group, LocalDate date) {
        ScheduleSessionContext context = scheduleContextService.resolveForGroup(session, group);
        ScheduleWeekApiResponse week = scheduleClient
            .fetchGroupWeek(context.branchGuid(), context.groupGuid(), date)
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

    private static String mergeAbsenceRanges(List<StudentAttendanceLessonResponse> absent) {
        if (absent.isEmpty()) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        String rangeStart = toDotTime(absent.getFirst().startTime());
        String rangeEnd = toDotTime(absent.getFirst().endTime());
        for (int i = 1; i < absent.size(); i++) {
            StudentAttendanceLessonResponse lesson = absent.get(i);
            String start = toDotTime(lesson.startTime());
            String end = toDotTime(lesson.endTime());
            if (rangeEnd.equals(start) || isImmediateNext(rangeEnd, start)) {
                rangeEnd = end;
            } else {
                parts.add(rangeStart + "-" + rangeEnd);
                rangeStart = start;
                rangeEnd = end;
            }
        }
        parts.add(rangeStart + "-" + rangeEnd);
        return String.join(", ", parts);
    }

    private static boolean isImmediateNext(String endDot, String startDot) {
        return endDot != null && startDot != null && endDot.compareTo(startDot) <= 0;
    }

    private static String toDotTime(String hhmm) {
        if (hhmm == null || hhmm.isBlank()) {
            return "";
        }
        return hhmm.trim().replace(':', '.');
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

    private record EnrichedStudent(String studentId, String fullName, String phone, String group) {}

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
}
