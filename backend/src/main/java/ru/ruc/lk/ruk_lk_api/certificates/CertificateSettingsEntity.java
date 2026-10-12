package ru.ruc.lk.ruk_lk_api.certificates;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

@Entity
@Table(name = "lk_certificate_settings")
public class CertificateSettingsEntity {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private LkAbsenceReportCampus campus;

    /** Если задан — письмо о новой PENDING. Пусто — только UI. */
    @Column(length = 320)
    private String notifyEmail;

    protected CertificateSettingsEntity() {}

    public CertificateSettingsEntity(LkAbsenceReportCampus campus) {
        this.campus = campus;
    }

    public LkAbsenceReportCampus getCampus() {
        return campus;
    }

    public String getNotifyEmail() {
        return notifyEmail;
    }

    public void setNotifyEmail(String notifyEmail) {
        if (notifyEmail == null || notifyEmail.isBlank()) {
            this.notifyEmail = null;
        } else {
            this.notifyEmail = notifyEmail.trim();
        }
    }
}
