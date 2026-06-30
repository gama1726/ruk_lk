package ru.ruc.lk.ruk_lk_api.passphoto.dto;

import java.time.Instant;

import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoStatus;

public record PassPhotoAdminItemDto(
    String id,
    String studentId,
    String studentFullName,
    String zachetka,
    PassPhotoStatus status,
    String validationWarningsJson,
    Instant submittedAt,
    Instant reviewedAt,
    String rejectReason,
    String percoError
) {}
