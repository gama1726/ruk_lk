package ru.ruc.lk.ruk_lk_api.cabinet.dto;

public record CabinetUserListItemDto(
    String id,
    String role,
    String studentId,
    String displayName,
    /** KAZAN | KRASNODAR | HEAD | OTHER | null */
    String campus,
    String campusLabel,
    String firstLoginAt,
    String lastLoginAt,
    String lastSeenAt
) {}
