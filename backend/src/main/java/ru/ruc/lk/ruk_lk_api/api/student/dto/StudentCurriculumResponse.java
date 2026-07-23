package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record StudentCurriculumResponse(
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
    double hoursPerCreditUnit,
    int itemsCount,
    List<CurriculumWorkingPlanResponse> workingStudyPlans,
    List<CurriculumSectionResponse> sections
) {}
