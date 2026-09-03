package ru.ruc.lk.ruk_lk_api.events.dto;

public record CampusEventWriteRequest(
    String campus,
    String title,
    String description,
    String startDate,
    String endDate,
    Boolean published
) {}
