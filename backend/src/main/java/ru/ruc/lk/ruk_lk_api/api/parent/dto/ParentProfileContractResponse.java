package ru.ruc.lk.ruk_lk_api.api.parent.dto;

public record ParentProfileContractResponse(
    String funding,
    String customerLabel,
    String paymentStatus,
    String paymentStatusLabel,
    String contractNumber,
    String contractDate,
    String contractDisplayDate
) {}
