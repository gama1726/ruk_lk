package ru.ruc.lk.ruk_lk_api.cabinet.dto;

import java.util.List;

public record CabinetStatsResponse(
    long totalRegistered,
    long onlineNow,
    long newInRange,
    long onlineWindowMinutes,
    String from,
    String to,
    List<CabinetStatsDayDto> series,
    List<CabinetUserListItemDto> recentUsers
) {}
