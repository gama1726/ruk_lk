package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookEntryResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookItem;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookResponse;

final class GradebookMapper {

    private GradebookMapper() {}

    static RecordBookResponse toResponse(OneCGradebookResponse source) {
        List<Integer> semesters = parseSemesters(source.semesters());

        List<RecordBookEntryResponse> items = new ArrayList<>();
        if (source.items() != null) {
            for (OneCGradebookItem item : source.items()) {
                items.add(toEntry(item));
            }
            items.sort(Comparator
                .comparingInt(RecordBookEntryResponse::semester)
                .thenComparing(entry -> entry.date() == null ? "" : entry.date())
                .thenComparing(RecordBookEntryResponse::subject));
        }

        if (semesters.isEmpty()) {
            semesters = items.stream()
                .map(RecordBookEntryResponse::semester)
                .distinct()
                .sorted()
                .toList();
        }

        return new RecordBookResponse(
            blankToEmpty(source.studentId()),
            blankToEmpty(source.studentFullName()),
            blankToEmpty(firstNonBlank(source.recordBook(), source.studentId())),
            blankToEmpty(source.asOfDate()),
            blankToEmpty(source.faculty()),
            blankToEmpty(source.specialty()),
            blankToEmpty(source.specialization()),
            blankToEmpty(source.studyForm()),
            blankToEmpty(source.group()),
            blankToEmpty(source.currentCourse()),
            blankToEmpty(source.studentState()),
            blankToEmpty(source.currentStudyPlan()),
            source.passedCount(),
            source.failedCount(),
            source.notGradedCount(),
            source.itemsCount() > 0 ? source.itemsCount() : items.size(),
            semesters,
            items
        );
    }

    private static RecordBookEntryResponse toEntry(OneCGradebookItem item) {
        String grade = blankToNull(item.grade());
        String normalizedGrade = grade == null ? "" : grade.toLowerCase(Locale.ROOT);
        String controlForm = normalizeControlForm(item.controlType());
        int hours = intValue(firstNonNull(item.hoursTotal(), item.hours()), 0);
        double creditUnits = doubleValue(item.creditUnits(), 0);

        return new RecordBookEntryResponse(
            buildId(item),
            intValue(item.semester(), 0),
            resolveSubject(item),
            controlForm,
            hours,
            grade,
            pointsForGrade(normalizedGrade),
            blankToEmpty(item.teacher()),
            blankToNull(item.date()),
            blankToEmpty(item.displayDate()),
            resolveStatus(item, normalizedGrade),
            blankToEmpty(item.statusTitle()),
            creditUnits,
            blankToEmpty(item.studyYear()),
            blankToEmpty(asText(item.course())),
            blankToEmpty(item.periodControl()),
            Boolean.TRUE.equals(item.practice()),
            Boolean.TRUE.equals(item.planned())
        );
    }

    private static String resolveSubject(OneCGradebookItem item) {
        return firstNonBlank(
            item.displayDiscipline(),
            item.disciplineFullName(),
            item.discipline()
        );
    }

    /**
     * Берём статус из 1С; для сданных предметов уточняем качество оценки
     * (отлично / хорошо / …), чтобы UI мог показывать цветные бейджи.
     */
    private static String resolveStatus(OneCGradebookItem item, String normalizedGrade) {
        if (Boolean.TRUE.equals(item.failed()) || "failed".equalsIgnoreCase(safe(item.status()))) {
            return "failed";
        }
        if (Boolean.TRUE.equals(item.planned())
            || "notGraded".equalsIgnoreCase(safe(item.status()))
            || "not_graded".equalsIgnoreCase(safe(item.status()))) {
            return "not_graded";
        }
        if (Boolean.TRUE.equals(item.passed()) || "passed".equalsIgnoreCase(safe(item.status()))) {
            String fromGrade = statusForGrade(normalizedGrade);
            if ("excellent".equals(fromGrade)
                || "good".equals(fromGrade)
                || "satisfactory".equals(fromGrade)
                || "passed".equals(fromGrade)) {
                return fromGrade;
            }
            return "passed";
        }
        return statusForGrade(normalizedGrade);
    }

    private static String buildId(OneCGradebookItem item) {
        if (item.rowNumber() != null && item.rowNumber() > 0) {
            return "rb-" + intValue(item.semester(), 0) + "-" + item.rowNumber()
                + "-" + safe(item.controlType()).hashCode();
        }
        return String.join("|",
            safe(asText(item.semester())),
            safe(resolveSubject(item)),
            safe(item.date()),
            safe(item.controlType())
        );
    }

    private static List<Integer> parseSemesters(List<Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream()
            .map(value -> intValue(value, -1))
            .filter(value -> value > 0)
            .distinct()
            .sorted()
            .toList();
    }

    private static String normalizeControlForm(String controlType) {
        if (controlType == null || controlType.isBlank()) {
            return "";
        }
        return controlType.trim().toLowerCase(Locale.ROOT).replace('ё', 'е');
    }

    private static String statusForGrade(String normalizedGrade) {
        String key = normalizeGradeKey(normalizedGrade);
        return switch (key) {
            case "зачтено" -> "passed";
            case "отлично" -> "excellent";
            case "хорошо" -> "good";
            case "удовлетворительно" -> "satisfactory";
            case "не зачтено", "незачтено", "неявка", "неудовлетворительно" -> "failed";
            case "" -> "not_graded";
            default -> "not_graded";
        };
    }

    private static Integer pointsForGrade(String normalizedGrade) {
        String key = normalizeGradeKey(normalizedGrade);
        return switch (key) {
            case "отлично" -> 5;
            case "хорошо" -> 4;
            case "удовлетворительно" -> 3;
            case "неудовлетворительно" -> 2;
            default -> null;
        };
    }

    /** Нижний регистр, ё→е, лишние пробелы — для «Не зачтено» / «незачтено». */
    private static String normalizeGradeKey(String normalizedGrade) {
        if (normalizedGrade == null || normalizedGrade.isBlank()) {
            return "";
        }
        return normalizedGrade
            .trim()
            .toLowerCase(Locale.ROOT)
            .replace('ё', 'е')
            .replaceAll("\\s+", " ");
    }

    private static int intValue(Object value, int fallback) {
        if (value == null) {
            return fallback;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return fallback;
        }
        try {
            return (int) Double.parseDouble(text.replace(',', '.'));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static double doubleValue(Object value, double fallback) {
        if (value == null) {
            return fallback;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return fallback;
        }
        try {
            return Double.parseDouble(text.replace(',', '.'));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static String asText(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private static <T> T firstNonNull(T first, T second) {
        return first != null ? first : second;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
