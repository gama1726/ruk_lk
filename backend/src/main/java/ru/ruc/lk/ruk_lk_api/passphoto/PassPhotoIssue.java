package ru.ruc.lk.ruk_lk_api.passphoto;

public record PassPhotoIssue(
    PassPhotoIssueCode code,
    PassPhotoIssueSeverity severity,
    String message
) {}
