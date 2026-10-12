package ru.ruc.lk.ruk_lk_api.certificates.dto;

public record CertificateAttachmentDto(
    String id,
    String originalFilename,
    String contentType,
    long sizeBytes
) {}
