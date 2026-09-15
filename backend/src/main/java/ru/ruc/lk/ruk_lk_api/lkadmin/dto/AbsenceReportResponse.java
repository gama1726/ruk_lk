package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record AbsenceReportResponse(
    String date,
    String group,
    String scheduleRange,
    int rosterSize,
    int absentCount,
    String source,
    List<AbsenceReportRowDto> rows,
    List<String> warnings
) {}
