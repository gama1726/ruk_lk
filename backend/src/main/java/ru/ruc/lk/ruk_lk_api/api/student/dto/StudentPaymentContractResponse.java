package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record StudentPaymentContractResponse(
    String number,
    String date,
    String displayDate,
    String label,
    String objectType
) {}
