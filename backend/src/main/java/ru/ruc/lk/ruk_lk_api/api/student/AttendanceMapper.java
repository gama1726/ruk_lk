package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceDayResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceSummaryResponse;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoAccessEvent;

final class AttendanceMapper {

    private static final DateTimeFormatter TIME_OUT = DateTimeFormatter.ofPattern("HH:mm");
    private static final List<DateTimeFormatter> DATE_TIME_FORMATS = List.of(
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME
    );
    private static final Pattern TIME_ONLY = Pattern.compile("(\\d{1,2}):(\\d{2})(?::\\d{2})?");
    private static final Pattern ISO_DATE = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern RU_DATE = Pattern.compile("(\\d{2})\\.(\\d{2})\\.(\\d{4})");

    private AttendanceMapper() {}

    static StudentAttendanceResponse toResponse(List<PercoAccessEvent> events) {
        Map<LocalDate, DayAgg> byDay = new LinkedHashMap<>();

        for (PercoAccessEvent event : events) {
            ParsedInstant parsed = parse(event.resolvedTimeLabel());
            if (parsed == null) {
                continue;
            }
            DayAgg agg = byDay.computeIfAbsent(parsed.date(), DayAgg::new);
            agg.accept(parsed.time(), event.resolvedGate());
        }

        List<StudentAttendanceDayResponse> days = byDay.entrySet().stream()
            .sorted(Map.Entry.<LocalDate, DayAgg>comparingByKey().reversed())
            .map(e -> {
                DayAgg agg = e.getValue();
                String checkIn = agg.earliest.format(TIME_OUT);
                String checkOut = agg.latest.format(TIME_OUT);
                return new StudentAttendanceDayResponse(
                    "d-" + e.getKey(),
                    e.getKey().toString(),
                    checkIn,
                    checkOut,
                    agg.gate
                );
            })
            .toList();

        String earliest = null;
        String latest = null;
        for (StudentAttendanceDayResponse day : days) {
            if (earliest == null || day.checkIn().compareTo(earliest) < 0) {
                earliest = day.checkIn();
            }
            if (latest == null || day.checkOut().compareTo(latest) > 0) {
                latest = day.checkOut();
            }
        }

        return new StudentAttendanceResponse(
            "perco",
            days,
            new StudentAttendanceSummaryResponse(days.size(), earliest, latest)
        );
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

    private record ParsedInstant(LocalDate date, LocalTime time) {}

    private static final class DayAgg {
        LocalTime earliest;
        LocalTime latest;
        String gate;

        DayAgg(LocalDate ignored) {}

        void accept(LocalTime time, String eventGate) {
            if (earliest == null || time.isBefore(earliest)) {
                earliest = time;
                if (eventGate != null && !eventGate.isBlank()) {
                    gate = eventGate;
                }
            }
            if (latest == null || time.isAfter(latest)) {
                latest = time;
            }
            if ((gate == null || gate.isBlank()) && eventGate != null && !eventGate.isBlank()) {
                gate = eventGate;
            }
        }
    }
}
