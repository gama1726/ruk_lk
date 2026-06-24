package ru.ruc.lk.ruk_lk_api.api.auth.dto;

/** Ответ после проверки зачётки и пароля — до ввода кода из письма. */
public record LoginChallengeResponse(
    String studentId,
    String email,
    String fullName
) {}
