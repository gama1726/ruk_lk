package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record RecordBookResponse(
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
    int passedCount,
    int failedCount,
    int notGradedCount,
    int itemsCount,
    List<Integer> semesters,
    List<RecordBookEntryResponse> items
) {}
