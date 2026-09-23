package ru.ruc.lk.ruk_lk_api.api.features;

/** Публичные feature-флаги для фронта. */
public record FeaturesDto(
    boolean attendanceEnabled,
    boolean startEnabled,
    boolean startShowInLk,
    /** Разделы «в разработке» доступны текущей сессии (тестовая зачётка). */
    boolean previewEnabled
) {}
