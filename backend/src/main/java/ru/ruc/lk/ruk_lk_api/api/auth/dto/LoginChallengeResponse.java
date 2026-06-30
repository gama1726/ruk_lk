package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import ru.ruc.lk.ruk_lk_api.api.auth.LoginCodeChannel;

/** Ответ после проверки зачётки — до ввода кода подтверждения. */
public record LoginChallengeResponse(
    String studentId,
    String email,
    LoginCodeChannel channel,
    String deliveryHint
) {}
