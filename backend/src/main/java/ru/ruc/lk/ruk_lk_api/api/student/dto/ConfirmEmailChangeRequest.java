package ru.ruc.lk.ruk_lk_api.api.student.dto;

/** Подтверждение смены почты кодом из письма. */
public record ConfirmEmailChangeRequest(String code) {}
