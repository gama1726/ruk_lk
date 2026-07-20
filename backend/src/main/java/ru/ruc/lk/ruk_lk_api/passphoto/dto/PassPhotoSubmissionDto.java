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
    boolean hasImage,
    /** Можно ли отправить новое фото сейчас (с учётом статуса и cooldown). */
    boolean canResubmit,
    /** Когда снова можно загрузить (ISO-8601), если canResubmit=false из‑за лимита. */
    String nextResubmitAt,
    /** Показывать ли фото пропуска как аватар в ЛК (по умолчанию false — коты). */
    boolean useAsAvatar
) {}
