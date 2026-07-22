package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record StudentPaymentTotalsResponse(
    double scheduled,
    double scheduledDue,
    double paid,
    double debt,
    double advance,
    double penalty,
    double totalToPay,
    int paidPercent
) {}
