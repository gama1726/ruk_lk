package ru.ruc.lk.ruk_lk_api.api.auth.dto;

/** Deep link для привязки MAX к зачетной книжке. */
public record MaxBindLinkResponse(String url, long expiresInSeconds) {}
