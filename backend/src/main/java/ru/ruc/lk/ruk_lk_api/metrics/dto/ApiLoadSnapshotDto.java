package ru.ruc.lk.ruk_lk_api.metrics.dto;

import java.util.List;

public record ApiLoadSnapshotDto(
    long collectedAtMs,
    long windowSeconds,
    int totalInFlight,
    double totalRequestsPerMinute,
    long processStartedAtMs,
    List<ApiLoadEndpointDto> endpoints,
    int outboundInFlight,
    double outboundRequestsPerMinute,
    List<ApiLoadEndpointDto> outbound,
    List<OutboundErrorDto> recentOutboundErrors,
    List<OutboundErrorDto> recentApiErrors
) {}
