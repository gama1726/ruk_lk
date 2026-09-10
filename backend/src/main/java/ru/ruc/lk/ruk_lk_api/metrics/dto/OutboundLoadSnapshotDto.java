package ru.ruc.lk.ruk_lk_api.metrics.dto;

import java.util.List;

public record OutboundLoadSnapshotDto(
    int totalInFlight,
    double totalRequestsPerMinute,
    List<ApiLoadEndpointDto> calls,
    List<OutboundErrorDto> recentErrors
) {}
