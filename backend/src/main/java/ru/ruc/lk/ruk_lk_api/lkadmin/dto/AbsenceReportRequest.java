package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

/**
 * @param date дата отчёта (YYYY-MM-DD)
 * @param scope {@code CAMPUS} (по умолчанию) или {@code GROUP}
 * @param group название группы (обязательно при scope=GROUP)
 * @param campus {@code KRASNODAR} (по умолчанию) или {@code KAZAN}
 */
public record AbsenceReportRequest(
    String date,
    String scope,
    String group,
    String campus
) {}
