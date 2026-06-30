package ru.ruc.lk.ruk_lk_api.api.auth.dto;

/** Ответ после проверки зачётки — до выбора канала доставки кода. */
public record IdentifyResponse(
    String studentId,
    String maskedEmail,
    String maskedPhone,
    boolean emailAvailable,
    boolean maxAvailable
) {}
