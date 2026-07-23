package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import ru.ruc.lk.ruk_lk_api.api.student.dto.CurriculumControlResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.CurriculumGroupResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.CurriculumItemResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.CurriculumSectionResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.CurriculumWorkingPlanResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumControl;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumGroup;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumItem;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumSection;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumWorkingPlan;

final class CurriculumMapper {

    private CurriculumMapper() {}

    static StudentCurriculumResponse toResponse(OneCCurriculumResponse source) {
        List<CurriculumWorkingPlanResponse> plans = new ArrayList<>();
        if (source.workingStudyPlans() != null) {
            for (OneCCurriculumWorkingPlan plan : source.workingStudyPlans()) {
                if (plan == null) continue;
                plans.add(new CurriculumWorkingPlanResponse(
                    blank(plan.presentation()),
                    blank(plan.number()),
                    blank(plan.date()),
                    blank(plan.displayDate()),
                    Boolean.TRUE.equals(plan.current()),
                    intOrZero(plan.firstSemester()),
                    intOrZero(plan.lastSemester())
                ));
            }
        }

        List<CurriculumSectionResponse> sections = new ArrayList<>();
        if (source.sections() != null) {
            for (OneCCurriculumSection section : source.sections()) {
                if (section == null) continue;
                sections.add(toSection(section));
            }
        }

        return new StudentCurriculumResponse(
            blank(source.studentId()),
            blank(source.studentFullName()),
            blank(firstNonBlank(source.recordBook(), source.studentId())),
            blank(source.asOfDate()),
            blank(source.faculty()),
            blank(source.specialty()),
            blank(source.group()),
            blank(source.currentCourse()),
            blank(source.studentState()),
            blank(source.studyPlan()),
            doubleOrZero(source.hoursPerCreditUnit()),
            source.itemsCount() > 0 ? source.itemsCount() : countItems(sections),
            List.copyOf(plans),
            List.copyOf(sections)
        );
    }

    private static CurriculumSectionResponse toSection(OneCCurriculumSection section) {
        List<CurriculumGroupResponse> groups = new ArrayList<>();
        if (section.groups() != null) {
            for (OneCCurriculumGroup group : section.groups()) {
                if (group == null) continue;
                groups.add(toGroup(section.code(), group));
            }
        }
        int count = section.itemsCount() > 0
            ? section.itemsCount()
            : groups.stream().mapToInt(CurriculumGroupResponse::itemsCount).sum();
        return new CurriculumSectionResponse(
            blank(section.code()),
            blank(section.title()),
            count,
            List.copyOf(groups)
        );
    }

    private static CurriculumGroupResponse toGroup(String sectionCode, OneCCurriculumGroup group) {
        List<CurriculumItemResponse> items = new ArrayList<>();
        if (group.items() != null) {
            int index = 0;
            for (OneCCurriculumItem item : group.items()) {
                if (item == null) continue;
                items.add(toItem(sectionCode, group.title(), item, index++));
            }
        }
        return new CurriculumGroupResponse(
            blank(group.title()),
            group.itemsCount() > 0 ? group.itemsCount() : items.size(),
            List.copyOf(items)
        );
    }

    private static CurriculumItemResponse toItem(
        String sectionCode,
        String groupTitle,
        OneCCurriculumItem item,
        int index
    ) {
        List<CurriculumControlResponse> controls = new ArrayList<>();
        if (item.controls() != null) {
            for (OneCCurriculumControl control : item.controls()) {
                if (control == null) continue;
                controls.add(new CurriculumControlResponse(
                    blank(control.type()),
                    intOrZero(control.semester()),
                    blank(control.periodControl()),
                    intOrZero(control.course()),
                    doubleOrZero(control.hours())
                ));
            }
        }

        List<Integer> semesters = item.semesters() == null
            ? List.of()
            : item.semesters().stream().filter(s -> s != null && s > 0).distinct().sorted().toList();

        return new CurriculumItemResponse(
            buildId(sectionCode, groupTitle, item.typeRecord(), item.title(), index),
            blank(item.typeRecord()),
            blank(item.title()),
            doubleOrZero(item.totalHours()),
            doubleOrZero(item.auditoryHours()),
            doubleOrZero(item.independentHours()),
            doubleOrZero(item.lectureHours()),
            doubleOrZero(item.practiceHours()),
            doubleOrZero(item.laboratoryHours()),
            doubleOrZero(item.creditUnits()),
            List.copyOf(semesters),
            formatControlLabel(controls),
            List.copyOf(controls)
        );
    }

    /** «Зачет: 1 семестр» или «Экзамен; 4 семестр» / несколько через «; ». */
    private static String formatControlLabel(List<CurriculumControlResponse> controls) {
        if (controls.isEmpty()) {
            return "";
        }
        return controls.stream()
            .map(control -> {
                String type = control.type();
                if (type.isBlank()) {
                    type = "Контроль";
                }
                if (control.semester() <= 0) {
                    return type;
                }
                String separator = type.toLowerCase(Locale.ROOT).contains("экзамен") ? "; " : ": ";
                return type + separator + control.semester() + " семестр";
            })
            .collect(Collectors.joining("; "));
    }

    private static String buildId(
        String sectionCode,
        String groupTitle,
        String typeRecord,
        String title,
        int index
    ) {
        String key = firstNonBlank(typeRecord, title);
        return blank(sectionCode) + "|" + blank(groupTitle) + "|" + key + "|" + index;
    }

    private static int countItems(List<CurriculumSectionResponse> sections) {
        return sections.stream()
            .flatMap(section -> section.groups().stream())
            .mapToInt(group -> group.items().size())
            .sum();
    }

    private static int intOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private static double doubleOrZero(Double value) {
        return value == null ? 0 : value;
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        return blank(fallback);
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
