package ru.ruc.lk.ruk_lk_api.lkadmin;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Флаги отчёта отсутствующих (деплой). Эффективное поведение = флаг AND настройка в админке.
 * Устаревшие {@code auto-enabled}/{@code notify-enabled} без префикса кампуса = Казань.
 */
@ConfigurationProperties(prefix = "app.absence-report")
public record AbsenceReportProperties(
    String autoCron,
    Boolean autoEnabled,
    Boolean notifyEnabled,
    CampusFlags kazan,
    CampusFlags krasnodar,
    CampusFlags head
) {
    public AbsenceReportProperties {
        if (autoCron == null || autoCron.isBlank()) {
            autoCron = "0 0 21 * * *";
        }
        if (kazan == null) {
            kazan = new CampusFlags(null, null);
        }
        if (krasnodar == null) {
            krasnodar = new CampusFlags(null, null);
        }
        if (head == null) {
            head = new CampusFlags(null, null);
        }
    }

    public record CampusFlags(Boolean autoEnabled, Boolean notifyEnabled) {}

    public boolean flagAutoEnabled(LkAbsenceReportCampus campus) {
        Boolean specific = flags(campus).autoEnabled();
        if (specific != null) {
            return specific;
        }
        if (campus == LkAbsenceReportCampus.KAZAN) {
            return autoEnabled == null || autoEnabled;
        }
        return false;
    }

    public boolean flagNotifyEnabled(LkAbsenceReportCampus campus) {
        Boolean specific = flags(campus).notifyEnabled();
        if (specific != null) {
            return specific;
        }
        if (campus == LkAbsenceReportCampus.KAZAN) {
            return notifyEnabled == null || notifyEnabled;
        }
        return false;
    }

    private CampusFlags flags(LkAbsenceReportCampus campus) {
        return switch (campus) {
            case KAZAN -> kazan;
            case KRASNODAR -> krasnodar;
            case HEAD -> head;
        };
    }
}
