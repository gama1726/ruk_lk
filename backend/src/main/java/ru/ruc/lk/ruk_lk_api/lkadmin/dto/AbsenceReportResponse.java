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
    /** MANUAL | AUTO */
    String origin,
    /** CAMPUS | GROUP */
    String scope,
    /** Имя группы при scope=GROUP */
    String filterGroup,
    List<AbsenceReportRowDto> rows,
    List<String> warnings,
    String error,
    String progressPhase,
    String progressLabel,
    int progressPercent,
    int progressCurrent,
    int progressTotal,
    /** Полное время сборки, мс; null если ещё нет / старый отчёт. */
    Long buildDurationMs,
    /** Завершённые этапы с длительностями (для супер-админки). */
    List<AbsenceReportStageTimingDto> stageTimings
) {}
