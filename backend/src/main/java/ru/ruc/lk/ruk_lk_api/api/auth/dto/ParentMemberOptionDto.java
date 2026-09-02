package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record ParentMemberOptionDto(
    int memberIndex,
    String relation,
    String relationKind,
    boolean isCustomer,
    boolean servicesBlocked,
    boolean loginAvailable
) {}
