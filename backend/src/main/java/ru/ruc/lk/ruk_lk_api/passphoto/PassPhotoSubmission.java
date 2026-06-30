package ru.ruc.lk.ruk_lk_api.passphoto;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pass_photo_submission")
public class PassPhotoSubmission {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String studentId;

    @Column(nullable = false)
    private String studentFullName;

    private String zachetka;

    @Column(nullable = false)
    private String storedFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PassPhotoStatus status;

    @Column(length = 1000)
    private String rejectReason;

    @Column(length = 4000)
    private String validationWarningsJson;

    @Column(nullable = false)
    private Instant submittedAt;

    private Instant reviewedAt;

    private String reviewedBy;

    private Instant percoSyncedAt;

    @Column(length = 2000)
    private String percoError;

    protected PassPhotoSubmission() {}

    public PassPhotoSubmission(
        UUID id,
        String studentId,
        String studentFullName,
        String zachetka,
        String storedFileName,
        PassPhotoStatus status,
        String validationWarningsJson
    ) {
        this.id = id;
        this.studentId = studentId;
        this.studentFullName = studentFullName;
        this.zachetka = zachetka;
        this.storedFileName = storedFileName;
        this.status = status;
        this.validationWarningsJson = validationWarningsJson;
        this.submittedAt = Instant.now();
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

    public String getZachetka() {
        return zachetka;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    public PassPhotoStatus getStatus() {
        return status;
    }

    public void setStatus(PassPhotoStatus status) {
        this.status = status;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    public String getValidationWarningsJson() {
        return validationWarningsJson;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getPercoSyncedAt() {
        return percoSyncedAt;
    }

    public void setPercoSyncedAt(Instant percoSyncedAt) {
        this.percoSyncedAt = percoSyncedAt;
    }

    public String getPercoError() {
        return percoError;
    }

    public void setPercoError(String percoError) {
        this.percoError = percoError;
    }
}
