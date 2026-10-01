package ru.ruc.lk.ruk_lk_api.cabinet.dto;

import java.util.List;

public record CabinetUserPageResponse(
    List<CabinetUserListItemDto> items,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
