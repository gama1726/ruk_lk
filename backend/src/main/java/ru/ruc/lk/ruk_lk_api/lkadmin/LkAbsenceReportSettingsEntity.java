package ru.ruc.lk.ruk_lk_api.lkadmin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Оперативные тумблеры админки. Эффект = флаг properties AND эти поля.
 */
@Entity
@Table(name = "lk_absence_report_settings")
public class LkAbsenceReportSettingsEntity {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private LkAbsenceReportCampus campus;

    @Column(nullable = false)
    private boolean autoEnabled = true;

    @Column(nullable = false)
    private boolean notifyEnabled = true;

    protected LkAbsenceReportSettingsEntity() {}

    public LkAbsenceReportSettingsEntity(LkAbsenceReportCampus campus) {
        this.campus = campus;
        this.autoEnabled = true;
        this.notifyEnabled = true;
    }

    public LkAbsenceReportCampus getCampus() {
        return campus;
    }

    public boolean isAutoEnabled() {
        return autoEnabled;
    }

    public void setAutoEnabled(boolean autoEnabled) {
        this.autoEnabled = autoEnabled;
    }

    public boolean isNotifyEnabled() {
        return notifyEnabled;
    }

    public void setNotifyEnabled(boolean notifyEnabled) {
        this.notifyEnabled = notifyEnabled;
    }
}
