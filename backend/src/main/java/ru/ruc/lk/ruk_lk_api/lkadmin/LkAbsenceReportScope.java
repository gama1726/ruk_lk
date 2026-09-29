package ru.ruc.lk.ruk_lk_api.lkadmin;

/**
 * Объём отчёта отсутствующих: весь кампус или одна группа.
 * Null у старых записей = {@link #CAMPUS}.
 */
public enum LkAbsenceReportScope {
    CAMPUS,
    GROUP
}
