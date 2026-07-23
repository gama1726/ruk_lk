package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code GET /hs/student/gradebook?studentId=...}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCGradebookResponse(
    boolean found,
    boolean gradebookFound,
    String studentId,
    String studentFullName,
    String recordBook,
    String asOfDate,
    String faculty,
    String specialty,
    String specialization,
    String studyForm,
    String group,
    String currentCourse,
    String studentState,
    String currentStudyPlan,
    List<String> workingStudyPlans,
    int semestersCount,
    int itemsCount,
    int passedCount,
    int failedCount,
    int notGradedCount,
    int unknownCount,
    List<Object> semesters,
    List<OneCGradebookItem> items
) {}
