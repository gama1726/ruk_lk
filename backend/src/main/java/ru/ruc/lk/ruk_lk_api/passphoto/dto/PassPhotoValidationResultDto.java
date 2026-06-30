package ru.ruc.lk.ruk_lk_api.passphoto.dto;

import java.util.List;

public record PassPhotoValidationResultDto(
    boolean ok,
    List<PassPhotoIssueDto> issues
) {}
