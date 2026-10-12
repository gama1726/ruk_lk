package ru.ruc.lk.ruk_lk_api.certificates.dto;

import java.time.LocalDate;

public record CertificateApproveRequest(
    LocalDate from,
    LocalDate to
) {}
