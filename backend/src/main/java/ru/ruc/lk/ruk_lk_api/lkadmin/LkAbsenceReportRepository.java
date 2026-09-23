package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LkAbsenceReportRepository extends JpaRepository<LkAbsenceReportEntity, UUID> {
    List<LkAbsenceReportEntity> findAllByOrderByCreatedAtDesc();

    List<LkAbsenceReportEntity> findByStatus(LkAbsenceReportStatus status);
}
