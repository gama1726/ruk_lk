package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record ParentMeResponse(
    String studentId,
    String studentFullName,
    boolean studentAdult,
    String relation,
    String parentFullName,
    boolean isCustomer,
    boolean servicesBlocked,
    boolean dataAccessAllowed,
    String consentRequiredMessage
) {}
