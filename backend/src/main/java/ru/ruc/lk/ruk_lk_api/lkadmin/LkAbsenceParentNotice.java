package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_absence_parent_notice")
@IdClass(LkAbsenceParentNoticeId.class)
public class LkAbsenceParentNotice {

    @Id
    @Column(nullable = false)
    private LocalDate reportDate;

    @Id
    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false)
    private boolean notified;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected LkAbsenceParentNotice() {}

    public LkAbsenceParentNotice(LocalDate reportDate, String studentId, boolean notified) {
        this.reportDate = reportDate;
        this.studentId = studentId;
        this.notified = notified;
        this.updatedAt = Instant.now();
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public String getStudentId() {
        return studentId;
    }

    public boolean isNotified() {
        return notified;
    }

    public void setNotified(boolean notified) {
        this.notified = notified;
        this.updatedAt = Instant.now();
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
