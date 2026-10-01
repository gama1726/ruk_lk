package ru.ruc.lk.ruk_lk_api.lkadmin;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LkAbsenceReportSettingsRepository
    extends JpaRepository<LkAbsenceReportSettingsEntity, LkAbsenceReportCampus> {}
