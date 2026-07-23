package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record RecordBookEntryResponse(
    String id,
    int semester,
    String subject,
    String controlForm,
    int hours,
    String grade,
    Integer points,
    String teacher,
    String date,
    String displayDate,
    String status,
    String statusTitle,
    double creditUnits,
    String studyYear,
    String course,
    String periodControl,
    boolean practice,
    boolean planned
) {}
