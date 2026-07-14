package ru.ruc.lk.ruk_lk_api.api.auth.dto;

/** Deep link для привязки MAX к зачётке. */
public record MaxBindLinkResponse(String url, long expiresInSeconds) {}
