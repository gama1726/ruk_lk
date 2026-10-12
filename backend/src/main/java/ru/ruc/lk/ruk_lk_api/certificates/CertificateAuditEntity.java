package ru.ruc.lk.ruk_lk_api.certificates;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_certificate_audit")
public class CertificateAuditEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID requestId;

    private UUID attachmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CertificateAuditAction action;

    @Column(nullable = false, length = 64)
    private String actorType;

    @Column(length = 128)
    private String actorId;

    @Column(length = 255)
    private String actorName;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(length = 500)
    private String detail;

    protected CertificateAuditEntity() {}

    public CertificateAuditEntity(
        UUID requestId,
        UUID attachmentId,
        CertificateAuditAction action,
        String actorType,
        String actorId,
        String actorName,
        String detail
    ) {
        this.id = UUID.randomUUID();
        this.requestId = requestId;
        this.attachmentId = attachmentId;
        this.action = action;
        this.actorType = actorType;
        this.actorId = actorId;
        this.actorName = actorName;
        this.detail = detail;
        this.createdAt = Instant.now();
    }
}
