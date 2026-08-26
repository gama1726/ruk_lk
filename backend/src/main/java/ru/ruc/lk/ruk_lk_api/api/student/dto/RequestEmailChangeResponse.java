package ru.ruc.lk.ruk_lk_api.api.student.dto;

/** Ответ после отправки кода на новую почту. */
public record RequestEmailChangeResponse(
    String maskedEmail,
    String message,
    int expiresInSeconds
) {}
