package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

public record AbsenceReportRowDto(
    String date,
    String group,
    String studentId,
    String fullName,
    String phone,
    String scheduleRange,
    String absenceRange,
    boolean parentNotified,
    String kind
) {}
