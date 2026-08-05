package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.megaapi")
public record MegaApiProperties(
    boolean enabled,
    String baseUrl,
    String authToken,
    int dbidx
) {
    public MegaApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://ilibrary.rucoop.ru/MegaApi";
        } else {
            baseUrl = baseUrl.trim().replaceAll("/+$", "");
        }
        if (authToken == null) {
            authToken = "";
        } else {
            authToken = authToken.trim();
        }
        if (dbidx < 0) {
            dbidx = 0;
        }
    }
}
