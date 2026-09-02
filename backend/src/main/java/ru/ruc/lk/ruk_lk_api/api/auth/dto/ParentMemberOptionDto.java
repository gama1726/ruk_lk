package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record ParentMemberOptionDto(
    int memberIndex,
    String relationKind,
    boolean loginAvailable
) {}
