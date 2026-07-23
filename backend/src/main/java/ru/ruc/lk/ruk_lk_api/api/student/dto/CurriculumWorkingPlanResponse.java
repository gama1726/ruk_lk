package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record CurriculumWorkingPlanResponse(
    String presentation,
    String number,
    String date,
    String displayDate,
    boolean current,
    int firstSemester,
    int lastSemester
) {}
