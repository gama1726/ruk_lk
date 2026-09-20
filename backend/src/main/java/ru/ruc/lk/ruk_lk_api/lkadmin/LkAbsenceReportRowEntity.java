package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_absence_report_row")
public class LkAbsenceReportRowEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private LkAbsenceReportEntity report;

    @Column(nullable = false, length = 32)
    private String dateLabel;

    @Column(nullable = false, length = 200)
    private String groupName;

    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false, length = 300)
    private String fullName;

    @Column(nullable = false, length = 500)
    private String phone = "";

    @Column(nullable = false, length = 64)
    private String scheduleRange = "";

    @Column(nullable = false, length = 1000)
    private String absenceRange = "";

    @Column(nullable = false, length = 16)
    private String kind = "full";

    protected LkAbsenceReportRowEntity() {}

    public LkAbsenceReportRowEntity(
        UUID id,
        String dateLabel,
        String groupName,
        String studentId,
        String fullName,
        String phone,
        String scheduleRange,
        String absenceRange,
        String kind
    ) {
        this.id = id;
        this.dateLabel = dateLabel;
        this.groupName = groupName;
        this.studentId = studentId;
        this.fullName = fullName;
        this.phone = phone == null ? "" : phone;
        this.scheduleRange = scheduleRange == null ? "" : scheduleRange;
        this.absenceRange = absenceRange == null ? "" : absenceRange;
        this.kind = kind == null ? "full" : kind;
    }

    public UUID getId() {
        return id;
    }

    public LkAbsenceReportEntity getReport() {
        return report;
    }

    public void setReport(LkAbsenceReportEntity report) {
        this.report = report;
    }

    public String getDateLabel() {
        return dateLabel;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
    }

    public String getScheduleRange() {
        return scheduleRange;
    }

    public String getAbsenceRange() {
        return absenceRange;
    }

    public String getKind() {
        return kind;
    }
}
