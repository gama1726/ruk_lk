package ru.ruc.lk.ruk_lk_api.metrics.dto;

public record ApiLoadEndpointDto(
    String method,
    String path,
    int inFlight,
    double requestsPerMinute,
    long completedTotal,
    long errors4xx,
    long errors5xx,
    double avgDurationMs,
    double minDurationMs,
    double maxDurationMs,
    /** Средняя нагрузка (in-flight) за всё время. */
    double avgInFlightAllTime,
    int minInFlightAllTime,
    int maxInFlightAllTime,
    /** Средний RPM за всё время (по сэмплам). */
    double avgRpmAllTime,
    double minRpmAllTime,
    double maxRpmAllTime
) {}
