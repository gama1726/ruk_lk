package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record AbsenceReportResponse(
    String id,
    String status,
    String date,
    String group,
    String scheduleRange,
    int rosterSize,
    int absentCount,
    String source,
    List<AbsenceReportRowDto> rows,
    List<String> warnings,
    String error,
    String progressPhase,
    String progressLabel,
    int progressPercent,
    int progressCurrent,
    int progressTotal
) {}
