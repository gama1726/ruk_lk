package ru.ruc.lk.ruk_lk_api.cabinet.dto;

public record CabinetCampusStatsDto(
    /** KAZAN | KRASNODAR | HEAD | OTHER | UNKNOWN */
    String campus,
    String label,
    long total,
    long online,
    long newInRange
) {}
