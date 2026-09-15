package ru.ruc.lk.ruk_lk_api.integration.start;

/** Ответ start.ruc.su на exchange: одноразовый ticket для callback. */
public record StartExchangeResponse(
    String ticket,
    Integer expiresInSeconds
) {}
