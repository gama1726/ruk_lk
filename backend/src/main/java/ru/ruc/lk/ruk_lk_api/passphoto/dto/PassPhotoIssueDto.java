package ru.ruc.lk.ruk_lk_api.passphoto.dto;

import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoIssueCode;
import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoIssueSeverity;

public record PassPhotoIssueDto(
    PassPhotoIssueCode code,
    PassPhotoIssueSeverity severity,
    String message
) {}
