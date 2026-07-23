package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code GET /hs/student/curriculum?studentId=...}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCCurriculumResponse(
    boolean found,
    boolean curriculumFound,
    String studentId,
    String studentFullName,
    String recordBook,
    String asOfDate,
    String faculty,
    String specialty,
    String group,
    String currentCourse,
    String studentState,
    String studyPlan,
    Double hoursPerCreditUnit,
    int workingStudyPlansCount,
    List<OneCCurriculumWorkingPlan> workingStudyPlans,
    int itemsCount,
    List<OneCCurriculumSection> sections
) {}
