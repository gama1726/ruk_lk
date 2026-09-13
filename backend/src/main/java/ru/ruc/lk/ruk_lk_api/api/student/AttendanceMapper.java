package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceDayResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceLessonResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceSummaryResponse;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction;

final class AttendanceMapper {

    static final String STATUS_PRESENT = "present";
    static final String STATUS_LATE = "late";
    static final String STATUS_ABSENT = "absent";
    /** Вход был, выход не зафиксирован — присутствие на паре не подтверждено. */
    static final String STATUS_UNCONFIRMED = "unconfirmed";

    private static final DateTimeFormatter TIME_OUT = DateTimeFormatter.ofPattern("HH:mm");
    private static final List<DateTimeFormatter> DATE_TIME_FORMATS = List.of(
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME
    );
    private static final List<DateTimeFormatter> TIME_FORMATS = List.of(
        DateTimeFormatter.ofPattern("H:mm:ss"),
        DateTimeFormatter.ofPattern("HH:mm:ss"),
        DateTimeFormatter.ofPattern("H:mm"),
        DateTimeFormatter.ofPattern("HH:mm")
    );
    private static final Pattern TIME_ONLY = Pattern.compile("(\\d{1,2}):(\\d{2})(?::\\d{2})?");
    private static final Pattern ISO_DATE = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern RU_DATE = Pattern.compile("(\\d{2})\\.(\\d{2})\\.(\\d{4})");

    private AttendanceMapper() {}

    static StudentAttendanceResponse toResponse(
        String source,
        List<SkudAccessEvent> events,
        List<CampusLesson> campusLessons
    ) {
        Map<LocalDate, List<ParsedEvent>> eventsByDay = new LinkedHashMap<>();
        for (SkudAccessEvent event : events) {
            ParsedInstant parsed = parse(event.timeLabel());
            if (parsed == null) {
                continue;
            }
            Direction direction = event.direction() == null ? Direction.UNKNOWN : event.direction();
            eventsByDay
                .computeIfAbsent(parsed.date(), ignored -> new ArrayList<>())
                .add(new ParsedEvent(parsed.time(), event.gate(), direction));
        }
        for (List<ParsedEvent> dayEvents : eventsByDay.values()) {
            dayEvents.sort(Comparator.comparing(ParsedEvent::time));
        }

        Map<LocalDate, List<CampusLesson>> lessonsByDay = new LinkedHashMap<>();
        if (campusLessons != null) {
            for (CampusLesson lesson : campusLessons) {
                if (lesson == null || lesson.date() == null || lesson.start() == null) {
                    continue;
                }
                lessonsByDay.computeIfAbsent(lesson.date(), ignored -> new ArrayList<>()).add(lesson);
            }
        }
        for (List<CampusLesson> dayLessons : lessonsByDay.values()) {
            dayLessons.sort(Comparator
                .comparing(CampusLesson::start)
                .thenComparing(l -> l.subject() == null ? "" : l.subject()));
        }

        LocalDate today = LocalDate.now();
        Set<LocalDate> allDates = new LinkedHashSet<>();
        allDates.addAll(eventsByDay.keySet());
        for (LocalDate date : lessonsByDay.keySet()) {
            if (!date.isAfter(today)) {
                allDates.add(date);
            }
        }

        List<LocalDate> sorted = new ArrayList<>(allDates);
        sorted.sort(Comparator.reverseOrder());

        List<StudentAttendanceDayResponse> days = new ArrayList<>(sorted.size());
        int presentDays = 0;
        int absentDays = 0;
        int lateLessons = 0;
        int unconfirmedLessons = 0;
        String earliest = null;
        String latest = null;

        for (LocalDate date : sorted) {
            List<ParsedEvent> dayEvents = eventsByDay.getOrDefault(date, List.of());
            List<CampusLesson> dayLessons = lessonsByDay.getOrDefault(date, List.of());
            PresenceModel presence = buildPresence(dayEvents, date, today);

            List<StudentAttendanceLessonResponse> lessonRows = new ArrayList<>();
            int dayLate = 0;
            int dayUnconfirmed = 0;
            for (CampusLesson lesson : dayLessons) {
                if (date.isAfter(today)) {
                    continue;
                }
                LessonOutcome outcome = evaluateLesson(lesson, presence, dayEvents);
                if (STATUS_LATE.equals(outcome.status())) {
                    dayLate++;
                    lateLessons++;
                } else if (STATUS_UNCONFIRMED.equals(outcome.status())) {
                    dayUnconfirmed++;
                    unconfirmedLessons++;
                }
                lessonRows.add(new StudentAttendanceLessonResponse(
                    "l-" + date + "-" + lesson.start().format(TIME_OUT) + "-" + safeHash(lesson.subject()),
                    blankToEmpty(lesson.subject()),
                    lesson.start().format(TIME_OUT),
                    lesson.end() == null ? "" : lesson.end().format(TIME_OUT),
                    blankToEmpty(lesson.classroom()),
                    outcome.status(),
                    outcome.arrivedAt() == null ? "" : outcome.arrivedAt().format(TIME_OUT),
                    outcome.lateMinutes()
                ));
            }

            boolean hasIn = dayEvents.stream().anyMatch(e -> e.direction() == Direction.IN);
            boolean hasOut = dayEvents.stream().anyMatch(e -> e.direction() == Direction.OUT);
            boolean unknownOnly = !dayEvents.isEmpty() && !hasIn && !hasOut;
            boolean onCampus = hasIn || hasOut || unknownOnly
                || !presence.intervals().isEmpty()
                || presence.danglingEntry() != null;
            String dayStatus;
            String checkIn = "";
            String checkOut = "";
            String gate = "";

            if (onCampus) {
                dayStatus = STATUS_PRESENT;
                presentDays++;
                LocalTime firstIn = minTime(dayEvents, Direction.IN);
                LocalTime lastOut = maxTime(dayEvents, Direction.OUT);
                if (hasIn && hasOut) {
                    checkIn = firstIn.format(TIME_OUT);
                    LocalTime outAfterIn = maxTimeOnOrAfter(dayEvents, Direction.OUT, firstIn);
                    if (outAfterIn != null) {
                        checkOut = outAfterIn.format(TIME_OUT);
                        gate = firstGate(dayEvents);
                    } else {
                        gate = appendNote(firstGate(dayEvents), "выход не зафиксирован");
                    }
                } else if (hasIn) {
                    checkIn = firstIn.format(TIME_OUT);
                    gate = appendNote(firstGate(dayEvents), "выход не зафиксирован");
                } else if (hasOut) {
                    checkOut = lastOut.format(TIME_OUT);
                    gate = appendNote("Был только выход", outGate(dayEvents));
                } else {
                    LocalTime firstPunch = dayEvents.stream()
                        .map(ParsedEvent::time)
                        .min(LocalTime::compareTo)
                        .orElse(null);
                    LocalTime lastPunch = dayEvents.stream()
                        .map(ParsedEvent::time)
                        .max(LocalTime::compareTo)
                        .orElse(null);
                    if (firstPunch != null) {
                        checkIn = firstPunch.format(TIME_OUT);
                    }
                    if (lastPunch != null && firstPunch != null && lastPunch.isAfter(firstPunch)) {
                        checkOut = lastPunch.format(TIME_OUT);
                    }
                    gate = firstGate(dayEvents);
                }
                if (!checkIn.isEmpty() && (earliest == null || checkIn.compareTo(earliest) < 0)) {
                    earliest = checkIn;
                }
                if (!checkOut.isEmpty() && (latest == null || checkOut.compareTo(latest) > 0)) {
                    latest = checkOut;
                }
                if (dayLate > 0) {
                    gate = appendNote(gate, "опозданий на пары: " + dayLate);
                }
                if (dayUnconfirmed > 0) {
                    gate = appendNote(gate, "без выхода: " + dayUnconfirmed);
                }
            } else if (!dayLessons.isEmpty()) {
                dayStatus = STATUS_ABSENT;
                absentDays++;
                gate = "По расписанию были занятия — на территории не был";
            } else {
                continue;
            }

            days.add(new StudentAttendanceDayResponse(
                "d-" + date,
                date.toString(),
                checkIn,
                checkOut,
                gate,
                dayStatus,
                lessonRows
            ));
        }

        return new StudentAttendanceResponse(
            source,
            days,
            new StudentAttendanceSummaryResponse(
                presentDays,
                absentDays,
                lateLessons,
                unconfirmedLessons,
                earliest,
                latest
            )
        );
    }

    /** Аудитория похожа на очное занятие в корпусе (не онлайн / не пустая). */
    static boolean isOnCampusClassroom(String classroom) {
        if (classroom == null || classroom.isBlank()) {
            return false;
        }
        String normalized = classroom.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("онлайн")
            || normalized.contains("online")
            || normalized.contains("дистанц")
            || normalized.contains("вебинар")
            || normalized.equals("до")
            || normalized.equals("сдо")
            || normalized.contains("teams")
            || normalized.contains("zoom")) {
            return false;
        }
        return true;
    }

    static LocalTime parseLessonTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        for (DateTimeFormatter formatter : TIME_FORMATS) {
            try {
                return LocalTime.parse(value, formatter).withSecond(0).withNano(0);
            } catch (DateTimeParseException ignored) {
                // next
            }
        }
        Matcher timeMatcher = TIME_ONLY.matcher(value);
        if (!timeMatcher.find()) {
            return null;
        }
        int hour = Integer.parseInt(timeMatcher.group(1));
        int minute = Integer.parseInt(timeMatcher.group(2));
        if (hour > 23 || minute > 59) {
            return null;
        }
        return LocalTime.of(hour, minute);
    }

    /**
     * Закрытые интервалы IN→OUT + «висящий» вход без OUT (для оранжевого статуса).
     * Сегодня висящий вход даёт интервал до текущего времени.
     */
    private static PresenceModel buildPresence(
        List<ParsedEvent> dayEvents,
        LocalDate date,
        LocalDate today
    ) {
        List<PresenceInterval> intervals = new ArrayList<>();
        boolean hasDirected = dayEvents.stream().anyMatch(e -> e.direction() != Direction.UNKNOWN);
        if (!hasDirected) {
            return new PresenceModel(intervals, null);
        }

        boolean inside = false;
        LocalTime enteredAt = null;
        String enterGate = null;
        for (ParsedEvent event : dayEvents) {
            if (event.direction() == Direction.IN) {
                if (!inside) {
                    inside = true;
                    enteredAt = event.time();
                    enterGate = event.gate();
                }
            } else if (event.direction() == Direction.OUT) {
                if (inside) {
                    LocalTime leftAt = event.time();
                    if (!leftAt.isAfter(enteredAt)) {
                        leftAt = enteredAt;
                    }
                    intervals.add(new PresenceInterval(enteredAt, leftAt, enterGate));
                    inside = false;
                    enteredAt = null;
                    enterGate = null;
                }
            }
        }

        LocalTime dangling = null;
        if (inside && enteredAt != null) {
            if (date.equals(today)) {
                LocalTime now = LocalTime.now().withSecond(0).withNano(0);
                LocalTime openEnd = now.isAfter(enteredAt) ? now : enteredAt;
                if (openEnd.isAfter(enteredAt)) {
                    intervals.add(new PresenceInterval(enteredAt, openEnd, enterGate));
                } else {
                    dangling = enteredAt;
                }
            } else {
                // Прошлый день без OUT — не продлеваем присутствие; помечаем висящий вход
                dangling = enteredAt;
            }
        }
        return new PresenceModel(intervals, dangling);
    }

    private static LessonOutcome evaluateLesson(
        CampusLesson lesson,
        PresenceModel presence,
        List<ParsedEvent> dayEvents
    ) {
        LocalTime start = lesson.start();
        LocalTime end = lesson.end() != null ? lesson.end() : start.plusMinutes(90);
        List<PresenceInterval> intervals = presence.intervals();

        boolean directed = dayEvents.stream()
            .anyMatch(e -> e.direction() == Direction.IN || e.direction() == Direction.OUT);

        if (directed) {
            for (PresenceInterval interval : intervals) {
                if (!interval.end().isAfter(interval.start())) {
                    continue;
                }
                if (!interval.start().isAfter(start) && interval.end().isAfter(start)) {
                    return new LessonOutcome(STATUS_PRESENT, interval.start(), 0);
                }
            }
            LocalTime firstInDuring = null;
            for (PresenceInterval interval : intervals) {
                if (!interval.end().isAfter(interval.start())) {
                    continue;
                }
                if (!interval.start().isBefore(start) && !interval.start().isAfter(end)) {
                    if (firstInDuring == null || interval.start().isBefore(firstInDuring)) {
                        firstInDuring = interval.start();
                    }
                }
            }
            if (firstInDuring != null) {
                int minutes = (int) java.time.Duration.between(start, firstInDuring).toMinutes();
                return new LessonOutcome(STATUS_LATE, firstInDuring, Math.max(1, minutes));
            }

            LocalTime dangling = presence.danglingEntry();
            if (dangling != null) {
                // Вход во время пары без OUT — скорее опоздание, чем «без выхода»
                if (!dangling.isBefore(start) && !dangling.isAfter(end)) {
                    int minutes = (int) java.time.Duration.between(start, dangling).toMinutes();
                    return new LessonOutcome(STATUS_LATE, dangling, Math.max(1, minutes));
                }
                // Вход раньше пары, выхода нет — не подтверждаем присутствие
                if (dangling.isBefore(start)) {
                    return new LessonOutcome(STATUS_UNCONFIRMED, dangling, null);
                }
            }
            return new LessonOutcome(STATUS_ABSENT, null, null);
        }

        // ZKBio / без направления: любой проход в окне пары
        LocalTime firstPunch = null;
        for (ParsedEvent event : dayEvents) {
            if (event.time().isBefore(start) || event.time().isAfter(end)) {
                continue;
            }
            if (firstPunch == null || event.time().isBefore(firstPunch)) {
                firstPunch = event.time();
            }
        }
        if (firstPunch == null) {
            for (ParsedEvent event : dayEvents) {
                if (!event.time().isAfter(start)) {
                    if (firstPunch == null || event.time().isBefore(firstPunch)) {
                        firstPunch = event.time();
                    }
                }
            }
            if (firstPunch != null) {
                return new LessonOutcome(STATUS_PRESENT, firstPunch, 0);
            }
            return new LessonOutcome(STATUS_ABSENT, null, null);
        }
        if (!firstPunch.isAfter(start)) {
            return new LessonOutcome(STATUS_PRESENT, firstPunch, 0);
        }
        int minutes = (int) java.time.Duration.between(start, firstPunch).toMinutes();
        return new LessonOutcome(STATUS_LATE, firstPunch, Math.max(1, minutes));
    }

    private static LocalTime minTime(List<ParsedEvent> dayEvents, Direction direction) {
        return dayEvents.stream()
            .filter(e -> e.direction() == direction)
            .map(ParsedEvent::time)
            .min(LocalTime::compareTo)
            .orElse(null);
    }

    private static LocalTime maxTime(List<ParsedEvent> dayEvents, Direction direction) {
        return dayEvents.stream()
            .filter(e -> e.direction() == direction)
            .map(ParsedEvent::time)
            .max(LocalTime::compareTo)
            .orElse(null);
    }

    private static LocalTime maxTimeOnOrAfter(
        List<ParsedEvent> dayEvents,
        Direction direction,
        LocalTime from
    ) {
        return dayEvents.stream()
            .filter(e -> e.direction() == direction && !e.time().isBefore(from))
            .map(ParsedEvent::time)
            .max(LocalTime::compareTo)
            .orElse(null);
    }

    private static String firstGate(List<ParsedEvent> dayEvents) {
        for (ParsedEvent event : dayEvents) {
            if (event.direction() == Direction.IN && event.gate() != null && !event.gate().isBlank()) {
                return event.gate();
            }
        }
        for (ParsedEvent event : dayEvents) {
            if (event.gate() != null && !event.gate().isBlank()) {
                return event.gate();
            }
        }
        return "";
    }

    private static String outGate(List<ParsedEvent> dayEvents) {
        ParsedEvent lastOut = null;
        for (ParsedEvent event : dayEvents) {
            if (event.direction() == Direction.OUT && event.gate() != null && !event.gate().isBlank()) {
                lastOut = event;
            }
        }
        return lastOut == null ? "" : lastOut.gate();
    }

    private static String appendNote(String gate, String note) {
        if (note == null || note.isBlank()) {
            return gate == null ? "" : gate;
        }
        if (gate == null || gate.isBlank()) {
            return note;
        }
        return gate + " · " + note;
    }

    private static ParsedInstant parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();

        for (DateTimeFormatter formatter : DATE_TIME_FORMATS) {
            try {
                LocalDateTime dt = LocalDateTime.parse(value, formatter);
                return new ParsedInstant(dt.toLocalDate(), dt.toLocalTime().withSecond(0).withNano(0));
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }

        try {
            if (value.length() >= 19 && value.charAt(10) == 'T') {
                LocalDateTime dt = LocalDateTime.parse(value.substring(0, 19));
                return new ParsedInstant(dt.toLocalDate(), dt.toLocalTime().withSecond(0).withNano(0));
            }
        } catch (DateTimeParseException ignored) {
            // fall through
        }

        LocalDate date = null;
        Matcher iso = ISO_DATE.matcher(value);
        if (iso.find()) {
            date = LocalDate.parse(iso.group(1));
        } else {
            Matcher ru = RU_DATE.matcher(value);
            if (ru.find()) {
                date = LocalDate.of(
                    Integer.parseInt(ru.group(3)),
                    Integer.parseInt(ru.group(2)),
                    Integer.parseInt(ru.group(1))
                );
            }
        }

        Matcher timeMatcher = TIME_ONLY.matcher(value);
        if (!timeMatcher.find()) {
            return null;
        }
        int hour = Integer.parseInt(timeMatcher.group(1));
        int minute = Integer.parseInt(timeMatcher.group(2));
        if (hour > 23 || minute > 59) {
            return null;
        }
        LocalTime time = LocalTime.of(hour, minute);
        if (date == null) {
            return null;
        }
        return new ParsedInstant(date, time);
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static int safeHash(String value) {
        return blankToEmpty(value).hashCode();
    }

    private record ParsedInstant(LocalDate date, LocalTime time) {}

    private record ParsedEvent(LocalTime time, String gate, Direction direction) {}

    private record PresenceInterval(LocalTime start, LocalTime end, String gate) {}

    private record PresenceModel(List<PresenceInterval> intervals, LocalTime danglingEntry) {}

    private record LessonOutcome(String status, LocalTime arrivedAt, Integer lateMinutes) {}
}
