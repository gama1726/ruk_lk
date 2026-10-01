package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

public record AbsenceReportCampusSettingsDto(
    String campus,
    String label,
    /** Тумблер в админке. */
    boolean autoEnabled,
    boolean notifyEnabled,
    /** Флаг из properties (деплой). */
    boolean flagAutoEnabled,
    boolean flagNotifyEnabled,
    /** autoEnabled AND flagAutoEnabled */
    boolean effectiveAuto,
    /** notifyEnabled AND flagNotifyEnabled */
    boolean effectiveNotify
) {}
