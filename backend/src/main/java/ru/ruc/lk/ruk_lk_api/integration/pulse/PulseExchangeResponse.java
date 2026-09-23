package ru.ruc.lk.ruk_lk_api.integration.pulse;

/** Ответ pulse.ruc.su на exchange: одноразовый ticket для callback. */
public record PulseExchangeResponse(String ticket) {}
