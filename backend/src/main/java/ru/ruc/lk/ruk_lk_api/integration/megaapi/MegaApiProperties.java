package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.megaapi")
public record MegaApiProperties(
    boolean enabled,
    String baseUrl,
    /** tokenGet — чтение (GetReader, GetHandBooks, …) */
    String tokenGet,
    /** tokenPut — запись (AddReader, UpdateReader); для ЛК пока не используется */
    String tokenPut,
    /** Устаревший алиас: если задан, а token-get пуст — используется как token-get */
    String authToken,
    int dbidx
) {
    public MegaApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://ilibrary.rucoop.ru/MegaApi";
        } else {
            baseUrl = baseUrl.trim().replaceAll("/+$", "");
        }
        if (tokenGet == null) {
            tokenGet = "";
        } else {
            tokenGet = tokenGet.trim();
        }
        if (tokenPut == null) {
            tokenPut = "";
        } else {
            tokenPut = tokenPut.trim();
        }
        if (authToken == null) {
            authToken = "";
        } else {
            authToken = authToken.trim();
        }
        if (tokenGet.isBlank() && !authToken.isBlank()) {
            tokenGet = authToken;
        }
        if (dbidx < 0) {
            dbidx = 0;
        }
    }
}
