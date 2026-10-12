package ru.ruc.lk.ruk_lk_api.certificates.dto;

import java.time.Instant;
import java.time.LocalDate;

public record CertificateRequestSummaryDto(
    String id,
    String studentId,
    String studentFullName,
    String type,
    String typeLabel,
    String status,
    Instant createdAt,
    LocalDate approvedFrom,
    LocalDate approvedTo,
    String rejectionReason,
    String group,
    String faculty,
    String course,
    String department,
    String reviewedBy,
    Instant reviewedAt
) {}
