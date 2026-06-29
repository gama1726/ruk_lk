package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleLessonResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleApiLesson;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleDateMeta;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;

final class ScheduleMapper {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter API_DAY = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private ScheduleMapper() {}

    static ScheduleResponse toResponse(String groupName, LocalDate anchorDate, ScheduleWeekApiResponse week) {
        ScheduleDateMeta meta = week.date();
        List<ScheduleLessonResponse> lessons = flattenLessons(week.schedule());

        LocalDate weekStart = weekStart(meta);
        LocalDate weekEnd = weekStart.plusDays(6);

        return new ScheduleResponse(
            groupName,
            weekStart.format(ISO_DATE),
            weekEnd.format(ISO_DATE),
            anchorDate.format(ISO_DATE),
            meta == null ? null : blankToNull(meta.back()),
            meta == null ? null : blankToNull(meta.next()),
            lessons
        );
    }

    private static List<ScheduleLessonResponse> flattenLessons(Map<String, List<ScheduleApiLesson>> schedule) {
        List<ScheduleLessonResponse> lessons = new ArrayList<>();
        if (schedule == null) {
            return lessons;
        }

        for (List<ScheduleApiLesson> dayLessons : schedule.values()) {
            if (dayLessons == null) {
                continue;
            }
            for (ScheduleApiLesson lesson : dayLessons) {
                lessons.add(toLesson(lesson));
            }
        }

        lessons.sort(Comparator
            .comparing(ScheduleLessonResponse::date)
            .thenComparing(ScheduleLessonResponse::start));

        return lessons;
    }

    private static ScheduleLessonResponse toLesson(ScheduleApiLesson lesson) {
        String isoDate = toIsoDate(lesson.data());
        String teacher = lesson.employee() == null ? "" : lesson.employee().trim();
        String group = lesson.group() == null ? "" : lesson.group().trim();
        String subject = lesson.discipline() == null ? "" : lesson.discipline().trim();
        String start = lesson.timeStart() == null ? "" : lesson.timeStart().trim();

        return new ScheduleLessonResponse(
            buildId(isoDate, start, subject, group),
            isoDate,
            subject,
            mapKind(lesson.type()),
            start,
            lesson.timeEnd() == null ? "" : lesson.timeEnd().trim(),
            lesson.classroom() == null ? "" : lesson.classroom().trim(),
            teacher,
            group,
            "scheduled"
        );
    }

    private static LocalDate weekStart(ScheduleDateMeta meta) {
        if (meta == null) {
            return LocalDate.now();
        }
        return LocalDate.of(meta.year(), meta.month(), meta.monday());
    }

    private static String toIsoDate(String apiDate) {
        if (apiDate == null || apiDate.isBlank()) {
            return "";
        }
        LocalDate parsed = LocalDate.parse(apiDate.trim(), API_DAY);
        return parsed.format(ISO_DATE);
    }

    private static String mapKind(String type) {
        if (type == null || type.isBlank()) {
            return "";
        }
        String normalized = type.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "лекция" -> "лекция";
            case "семинар" -> "практика";
            case "лабораторная" -> "лабораторная";
            case "экзамен" -> "экзамен";
            case "консультация" -> "консультация";
            default -> normalized;
        };
    }

    private static String buildId(String isoDate, String start, String subject, String group) {
        return String.join("|", isoDate, start, subject, group);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
