package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record ParentMemberOptionDto(
    int memberIndex,
    String relation,
    String displayName,
    boolean isCustomer,
    boolean servicesBlocked,
    boolean emailAvailable,
    String emailHint
) {}
