package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoClient;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoException;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.GroupRosterSaveRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.ParentNoticeRequest;

@Service
public class LkAbsenceReportService {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportService.class);
    private static final DateTimeFormatter DATE_RU = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_DOT = DateTimeFormatter.ofPattern("HH.mm");
    private static final int MAX_ROSTER = 120;

    private final ScheduleContextService scheduleContextService;
    private final ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient scheduleClient;
    private final OneCClient onecClient;
    private final PercoClient percoClient;
    private final LkGroupRosterRepository rosterRepository;
    private final LkAbsenceParentNoticeRepository noticeRepository;
    private final boolean attendanceEnabled;
    private final String percoUncontrolledZone;

    public LkAbsenceReportService(
        ScheduleContextService scheduleContextService,
        ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient scheduleClient,
        OneCClient onecClient,
        PercoClient percoClient,
        LkGroupRosterRepository rosterRepository,
        LkAbsenceParentNoticeRepository noticeRepository,
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled,
        @Value("${app.perco.uncontrolled-zone:Неконтролируемая территория}") String percoUncontrolledZone
    ) {
        this.scheduleContextService = scheduleContextService;
        this.scheduleClient = scheduleClient;
        this.onecClient = onecClient;
        this.percoClient = percoClient;
        this.rosterRepository = rosterRepository;
        this.noticeRepository = noticeRepository;
        this.attendanceEnabled = attendanceEnabled;
        this.percoUncontrolledZone = percoUncontrolledZone;
    }

    public AbsenceReportResponse build(HttpSession session, AbsenceReportRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ABSENCE_REPORT);
        if (!attendanceEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Посещаемость отключена");
        }
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LocalDate date = parseDate(body.date());
        String group = requireText(body.group(), "Укажите номер группы");
        List<String> studentIds = resolveStudentIds(group, body.studentIds());
        if (studentIds.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Укажите зачётки состава группы или сохраните состав заранее"
            );
        }
        if (studentIds.size() > MAX_ROSTER) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Не больше " + MAX_ROSTER + " зачёток за один отчёт"
            );
        }
        if (Boolean.TRUE.equals(body.saveRoster())) {
            saveRosterInternal(group, studentIds);
        }

        List<String> warnings = new ArrayList<>();
        List<CampusLesson> dayLessons = loadCampusLessons(session, group, date);
        if (dayLessons.isEmpty()) {
            warnings.add("На выбранную дату нет очных пар в расписании группы");
        }
        String scheduleRange = formatScheduleRange(dayLessons);

        List<AbsenceReportRowDto> rows = new ArrayList<>();
        for (String studentId : studentIds) {
            try {
                AbsenceReportRowDto row = buildRow(
                    date,
                    group,
                    scheduleRange,
                    dayLessons,
                    studentId
                );
                if (row != null) {
                    rows.add(row);
                }
            } catch (Exception e) {
                warnings.add(studentId + ": " + shortMessage(e));
                log.info("absence report student {}: {}", studentId, e.getMessage());
            }
        }
        rows.sort(Comparator.comparing(AbsenceReportRowDto::fullName, String.CASE_INSENSITIVE_ORDER));

        return new AbsenceReportResponse(
            date.toString(),
            group,
            scheduleRange,
            studentIds.size(),
            rows.size(),
            "perco",
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

    private AbsenceReportRowDto buildRow(
        LocalDate date,
        String group,
        String scheduleRange,
        List<CampusLesson> dayLessons,
        String studentId
    ) throws PercoException {
        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        String fullName = profile != null && profile.fullName() != null && !profile.fullName().isBlank()
            ? profile.fullName().trim()
            : studentId;
        String phone = profile != null && profile.phone() != null ? profile.phone().trim() : "";
        String profileGroup = profile != null && profile.group() != null ? profile.group().trim() : group;

        List<PercoAccessEvent> rawEvents = percoClient.fetchAccessEvents(studentId, date, date);
        List<SkudAccessEvent> events = mapPercoEvents(rawEvents);
        StudentAttendanceResponse attendance = AttendanceMapper.toResponse("perco", events, dayLessons);
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

        String absenceRange = mergeAbsenceRanges(absent);
        boolean fullDay = !dayLessons.isEmpty() && absent.size() >= dayLessons.size();
        String kind = fullDay ? "full" : "partial";
        boolean notified = noticeRepository
            .findByReportDateAndStudentId(date, studentId)
            .map(LkAbsenceParentNotice::isNotified)
            .orElse(false);

        return new AbsenceReportRowDto(
            date.format(DATE_RU),
            blank(profileGroup).isEmpty() ? group : profileGroup,
            studentId,
            fullName,
            phone,
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

    private List<SkudAccessEvent> mapPercoEvents(List<PercoAccessEvent> events) {
        if (events == null || events.isEmpty()) {
            return List.of();
        }
        List<SkudAccessEvent> mapped = new ArrayList<>(events.size());
        for (PercoAccessEvent event : events) {
            if (event == null) {
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

    private List<String> resolveStudentIds(String group, List<String> requested) {
        List<String> fromRequest = normalizeIds(requested);
        if (!fromRequest.isEmpty()) {
            return fromRequest;
        }
        return rosterRepository.findById(group)
            .map(r -> normalizeIds(r.getStudentIds()))
            .orElse(List.of());
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
        // соседние пары часто 09.40 и 09.50 — считаем продолжением блока отсутствия
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
}
