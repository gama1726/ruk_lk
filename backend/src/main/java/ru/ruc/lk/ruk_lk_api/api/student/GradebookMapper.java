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
        List<Integer> semesters = source.semesters() == null
            ? List.of()
            : source.semesters().stream()
                .map(Integer::parseInt)
                .sorted()
                .toList();

        List<RecordBookEntryResponse> items = new ArrayList<>();
        if (source.items() != null) {
            for (OneCGradebookItem item : source.items()) {
                items.add(toEntry(item));
            }
            items.sort(Comparator
                .comparingInt(RecordBookEntryResponse::semester)
                .thenComparing(entry -> entry.date() == null ? "" : entry.date()));
        }

        return new RecordBookResponse(
            blankToEmpty(source.studentId()),
            semesters,
            items
        );
    }

    private static RecordBookEntryResponse toEntry(OneCGradebookItem item) {
        String grade = blankToNull(item.grade());
        String normalizedGrade = grade == null ? "" : grade.toLowerCase(Locale.ROOT);
        String controlForm = normalizeControlForm(item.controlType());

        return new RecordBookEntryResponse(
            buildId(item),
            Integer.parseInt(item.semester()),
            blankToEmpty(item.discipline()),
            controlForm,
            item.hours(),
            grade,
            pointsForGrade(normalizedGrade),
            blankToEmpty(item.teacher()),
            blankToNull(item.date()),
            blankToEmpty(item.displayDate()),
            statusForGrade(normalizedGrade),
            item.creditUnits(),
            blankToEmpty(item.studyYear()),
            blankToEmpty(item.course()),
            blankToEmpty(item.periodControl())
        );
    }

    private static String buildId(OneCGradebookItem item) {
        return String.join("|",
            safe(item.semester()),
            safe(item.discipline()),
            safe(item.date()),
            safe(item.controlType())
        );
    }

    private static String normalizeControlForm(String controlType) {
        if (controlType == null || controlType.isBlank()) {
            return "";
        }
        return controlType.trim().toLowerCase(Locale.ROOT).replace('ё', 'е');
    }

    private static String statusForGrade(String normalizedGrade) {
        return switch (normalizedGrade) {
            case "зачтено" -> "passed";
            case "отлично" -> "excellent";
            case "хорошо" -> "good";
            case "удовлетворительно" -> "satisfactory";
            case "не зачтено", "неявка" -> "failed";
            case "" -> "not_graded";
            default -> "not_graded";
        };
    }

    private static Integer pointsForGrade(String normalizedGrade) {
        return switch (normalizedGrade) {
            case "отлично" -> 5;
            case "хорошо" -> 4;
            case "удовлетворительно" -> 3;
            default -> null;
        };
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
