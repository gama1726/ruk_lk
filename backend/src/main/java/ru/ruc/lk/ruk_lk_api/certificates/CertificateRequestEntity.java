package ru.ruc.lk.ruk_lk_api.certificates;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

@Entity
@Table(name = "lk_certificate_request")
public class CertificateRequestEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false, length = 255)
    private String studentFullName = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LkAbsenceReportCampus campus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CertificateType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CertificateStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CertificateSubmittedBy submittedBy;

    @Column(length = 255)
    private String submitterName;

    @Column(length = 320)
    private String submitterEmail;

    /** Ключ привязки MAX (studentId или P:studentId:index). */
    @Column(length = 128)
    private String submitterMaxBindKey;

    @Column(length = 2000)
    private String comment;

    @Column(length = 2000)
    private String rejectionReason;

    private LocalDate approvedFrom;

    private LocalDate approvedTo;

    @Column(length = 128)
    private String reviewedBy;

    private Instant reviewedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("uploadedAt ASC")
    private List<CertificateAttachmentEntity> attachments = new ArrayList<>();

    protected CertificateRequestEntity() {}

    public CertificateRequestEntity(
        UUID id,
        String studentId,
        String studentFullName,
        LkAbsenceReportCampus campus,
        CertificateType type,
        CertificateSubmittedBy submittedBy,
        String submitterName,
        String submitterEmail,
        String submitterMaxBindKey,
        String comment
    ) {
        Instant now = Instant.now();
        this.id = id;
        this.studentId = studentId;
        this.studentFullName = studentFullName == null ? "" : studentFullName;
        this.campus = campus;
        this.type = type;
        this.status = CertificateStatus.PENDING;
        this.submittedBy = submittedBy;
        this.submitterName = submitterName;
        this.submitterEmail = blankToNull(submitterEmail);
        this.submitterMaxBindKey = blankToNull(submitterMaxBindKey);
        this.comment = comment;
        this.createdAt = now;
        this.updatedAt = now;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public UUID getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getStudentFullName() {
        return studentFullName;
    }

    public LkAbsenceReportCampus getCampus() {
        return campus;
    }

    public CertificateType getType() {
        return type;
    }

    public CertificateStatus getStatus() {
        return status;
    }

    public void setStatus(CertificateStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public CertificateSubmittedBy getSubmittedBy() {
        return submittedBy;
    }

    public String getSubmitterName() {
        return submitterName;
    }

    public String getSubmitterEmail() {
        return submitterEmail;
    }

    public String getSubmitterMaxBindKey() {
        return submitterMaxBindKey;
    }

    public String getComment() {
        return comment;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDate getApprovedFrom() {
        return approvedFrom;
    }

    public LocalDate getApprovedTo() {
        return approvedTo;
    }

    public void approve(LocalDate from, LocalDate to, String reviewer) {
        this.status = CertificateStatus.APPROVED;
        this.approvedFrom = from;
        this.approvedTo = to;
        this.rejectionReason = null;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
        this.updatedAt = this.reviewedAt;
    }

    public void reject(String reason, String reviewer) {
        this.status = CertificateStatus.REJECTED;
        this.rejectionReason = reason;
        this.approvedFrom = null;
        this.approvedTo = null;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
        this.updatedAt = this.reviewedAt;
    }

    public void cancel() {
        this.status = CertificateStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<CertificateAttachmentEntity> getAttachments() {
        return attachments;
    }

    public void addAttachment(CertificateAttachmentEntity attachment) {
        attachments.add(attachment);
        attachment.setRequest(this);
    }
}
