package ru.ruc.lk.ruk_lk_api.cabinet.dto;

public record CabinetUserListItemDto(
    String id,
    String role,
    String studentId,
    String displayName,
    /** Id филиала (main, kazan, …) или null */
    String campus,
    String campusLabel,
    String firstLoginAt,
    String lastLoginAt,
    String lastSeenAt
) {}
