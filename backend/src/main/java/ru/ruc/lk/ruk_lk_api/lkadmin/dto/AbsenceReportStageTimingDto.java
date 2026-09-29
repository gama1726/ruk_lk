package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

/** Длительность одного этапа сборки отчёта отсутствующих. */
public record AbsenceReportStageTimingDto(
    String phase,
    String label,
    long durationMs
) {}
