package ru.ruc.lk.ruk_lk_api.metrics.dto;

public record OutboundErrorDto(
    long atMs,
    String service,
    String operation,
    int status,
    String detail
) {}
