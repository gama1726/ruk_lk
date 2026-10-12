package ru.ruc.lk.ruk_lk_api.certificates.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record CertificateRequestDto(
    String id,
    String studentId,
    String studentFullName,
    String campus,
    String type,
    String typeLabel,
    String status,
    String submittedBy,
    String submitterName,
    String comment,
    String rejectionReason,
    LocalDate approvedFrom,
    LocalDate approvedTo,
    Instant createdAt,
    Instant reviewedAt,
    List<CertificateAttachmentDto> attachments
) {}
