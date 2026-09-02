package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record ParentDeliveryOptionsDto(
    boolean emailAvailable,
    boolean maxAvailable,
    boolean maxPhoneChanged,
    String maskedEmail,
    String maskedPhone,
    boolean canSendCode
) {}
