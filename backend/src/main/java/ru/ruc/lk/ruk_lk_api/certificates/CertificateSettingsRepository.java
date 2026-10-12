package ru.ruc.lk.ruk_lk_api.certificates;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

public interface CertificateSettingsRepository
    extends JpaRepository<CertificateSettingsEntity, LkAbsenceReportCampus> {}
