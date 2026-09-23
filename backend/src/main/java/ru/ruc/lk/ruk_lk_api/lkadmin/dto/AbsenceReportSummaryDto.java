package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

public record AbsenceReportSummaryDto(
    String id,
    String date,
    String status,
    /** MANUAL | AUTO */
    String origin,
    int rosterSize,
    int absentCount,
    String createdAt,
    String finishedAt,
    String error
) {}
