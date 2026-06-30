package ru.ruc.lk.ruk_lk_api.passphoto.dto;

import java.util.List;

import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoStatus;

public record PassPhotoSubmissionDto(
    String id,
    PassPhotoStatus status,
    String rejectReason,
    List<PassPhotoIssueDto> warnings,
    String submittedAt,
    String reviewedAt,
    String percoSyncedAt,
    String percoError,
    boolean hasImage
) {}
