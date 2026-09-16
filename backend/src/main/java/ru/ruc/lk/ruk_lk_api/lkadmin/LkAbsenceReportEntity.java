package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_absence_report")
public class LkAbsenceReportEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private LocalDate reportDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LkAbsenceReportStatus status = LkAbsenceReportStatus.RUNNING;

    @Column(nullable = false, length = 32)
    private String source = "zkbio";

    @Column(nullable = false, length = 120)
    private String campusLabel = "Казань (ZKBio)";

    @Column(nullable = false)
    private int zkbioTotal;

    @Column(nullable = false)
    private int candidateCount;

    @Column(nullable = false)
    private int checkedCount;

    @Column(nullable = false)
    private int absentCount;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String warningsText = "";

    @Column(length = 1000)
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant finishedAt;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("groupName ASC, fullName ASC")
    private List<LkAbsenceReportRowEntity> rows = new ArrayList<>();

    protected LkAbsenceReportEntity() {}

    public LkAbsenceReportEntity(UUID id, LocalDate reportDate) {
        this.id = id;
        this.reportDate = reportDate;
        this.status = LkAbsenceReportStatus.RUNNING;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public LkAbsenceReportStatus getStatus() {
        return status;
    }

    public void setStatus(LkAbsenceReportStatus status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public String getCampusLabel() {
        return campusLabel;
    }

    public int getZkbioTotal() {
        return zkbioTotal;
    }

    public void setZkbioTotal(int zkbioTotal) {
        this.zkbioTotal = zkbioTotal;
    }

    public int getCandidateCount() {
        return candidateCount;
    }

    public void setCandidateCount(int candidateCount) {
        this.candidateCount = candidateCount;
    }

    public int getCheckedCount() {
        return checkedCount;
    }

    public void setCheckedCount(int checkedCount) {
        this.checkedCount = checkedCount;
    }

    public int getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(int absentCount) {
        this.absentCount = absentCount;
    }

    public String getWarningsText() {
        return warningsText == null ? "" : warningsText;
    }

    public void setWarningsText(String warningsText) {
        this.warningsText = warningsText == null ? "" : warningsText;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public List<LkAbsenceReportRowEntity> getRows() {
        return rows;
    }

    public void replaceRows(List<LkAbsenceReportRowEntity> next) {
        rows.clear();
        if (next != null) {
            for (LkAbsenceReportRowEntity row : next) {
                row.setReport(this);
                rows.add(row);
            }
        }
    }
}
