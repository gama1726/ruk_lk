package ru.ruc.lk.ruk_lk_api.certificates.dto;

import java.time.Instant;

public record CertificateRequestSummaryDto(
    String id,
    String studentId,
    String studentFullName,
    String type,
    String typeLabel,
    String status,
    Instant createdAt
) {}
