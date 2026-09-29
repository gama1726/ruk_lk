package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

public record AbsenceReportSummaryDto(
    String id,
    String date,
    String status,
    /** MANUAL | AUTO */
    String origin,
    /** CAMPUS | GROUP */
    String scope,
    /** Имя группы при scope=GROUP */
    String filterGroup,
    int rosterSize,
    int absentCount,
    String createdAt,
    String finishedAt,
    String error,
    /** Полное время сборки, мс; null у старых отчётов. */
    Long buildDurationMs
) {}
