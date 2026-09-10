package ru.ruc.lk.ruk_lk_api.cabinet.dto;

public record CabinetStatsDayDto(
    String date,
    long students,
    long parents,
    long total
) {}
