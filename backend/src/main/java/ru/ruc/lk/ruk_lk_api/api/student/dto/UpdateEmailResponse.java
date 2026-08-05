package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record UpdateEmailResponse(
    String email,
    String oldEmail,
    String message
) {}
