package ru.ruc.lk.ruk_lk_api.certificates;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

public interface CertificateRequestRepository extends JpaRepository<CertificateRequestEntity, UUID> {

    List<CertificateRequestEntity> findByCampusOrderByCreatedAtDesc(LkAbsenceReportCampus campus);

    List<CertificateRequestEntity> findByStudentIdOrderByCreatedAtDesc(String studentId);

    @Query("""
        select distinct r.studentId from CertificateRequestEntity r
        where r.campus = :campus
          and r.status = ru.ruc.lk.ruk_lk_api.certificates.CertificateStatus.APPROVED
          and r.approvedFrom <= :day
          and r.approvedTo >= :day
        """)
    List<String> findApprovedStudentIdsForDay(
        @Param("campus") LkAbsenceReportCampus campus,
        @Param("day") LocalDate day
    );

    @Query("""
        select r from CertificateRequestEntity r
        where r.status in (
            ru.ruc.lk.ruk_lk_api.certificates.CertificateStatus.REJECTED,
            ru.ruc.lk.ruk_lk_api.certificates.CertificateStatus.CANCELLED
          )
          and r.updatedAt < :before
        """)
    List<CertificateRequestEntity> findClosedBefore(@Param("before") Instant before);

    @Query("""
        select r from CertificateRequestEntity r
        where r.status = ru.ruc.lk.ruk_lk_api.certificates.CertificateStatus.APPROVED
          and r.approvedTo < :beforeDay
        """)
    List<CertificateRequestEntity> findApprovedEndedBefore(@Param("beforeDay") LocalDate beforeDay);
}
