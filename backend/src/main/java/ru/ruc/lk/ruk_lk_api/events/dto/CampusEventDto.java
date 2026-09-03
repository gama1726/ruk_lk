package ru.ruc.lk.ruk_lk_api.events.dto;

import java.util.UUID;

public record CampusEventDto(
    UUID id,
    String title,
    String description,
    String startDate,
    String endDate,
    boolean published,
    String createdAt,
    String updatedAt
) {}
