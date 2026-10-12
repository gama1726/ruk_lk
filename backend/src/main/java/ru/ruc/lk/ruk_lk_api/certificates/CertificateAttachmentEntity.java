package ru.ruc.lk.ruk_lk_api.certificates;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_certificate_attachment")
public class CertificateAttachmentEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private CertificateRequestEntity request;

    @Column(nullable = false, length = 512)
    private String storageKey;

    @Column(nullable = false, length = 512)
    private String originalFilename;

    @Column(nullable = false, length = 128)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private boolean normalizedImage;

    @Column(nullable = false)
    private Instant uploadedAt;

    /** Когда файл удалён retention-job (метаданные заявки могут остаться). */
    private Instant purgedAt;

    protected CertificateAttachmentEntity() {}

    public CertificateAttachmentEntity(
        UUID id,
        String storageKey,
        String originalFilename,
        String contentType,
        long sizeBytes,
        boolean normalizedImage
    ) {
        this.id = id;
        this.storageKey = storageKey;
        this.originalFilename = originalFilename == null ? "file" : originalFilename;
        this.contentType = contentType == null ? "application/octet-stream" : contentType;
        this.sizeBytes = sizeBytes;
        this.normalizedImage = normalizedImage;
        this.uploadedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public CertificateRequestEntity getRequest() {
        return request;
    }

    void setRequest(CertificateRequestEntity request) {
        this.request = request;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public boolean isNormalizedImage() {
        return normalizedImage;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public Instant getPurgedAt() {
        return purgedAt;
    }

    public void markPurged() {
        this.purgedAt = Instant.now();
        this.storageKey = "";
        this.sizeBytes = 0;
    }
}
