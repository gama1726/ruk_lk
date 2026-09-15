package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LkAbsenceParentNoticeRepository
    extends JpaRepository<LkAbsenceParentNotice, LkAbsenceParentNoticeId> {

    Optional<LkAbsenceParentNotice> findByReportDateAndStudentId(LocalDate reportDate, String studentId);
}
