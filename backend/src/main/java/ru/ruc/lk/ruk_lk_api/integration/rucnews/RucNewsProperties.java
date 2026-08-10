package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ruc-news")
public record RucNewsProperties(
    boolean enabled,
    String listUrl,
    String baseUrl,
    int cacheTtlSeconds,
    /** Сколько страниц /blog/?PAGEN_1=N обходить (защита от бесконечного обхода). */
    int maxPages
) {
    public RucNewsProperties {
        if (listUrl == null || listUrl.isBlank()) {
            listUrl = "https://new.ruc.su/blog/";
        } else {
            listUrl = listUrl.trim();
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://new.ruc.su";
        } else {
            baseUrl = baseUrl.trim().replaceAll("/+$", "");
        }
        if (cacheTtlSeconds < 60) {
            cacheTtlSeconds = 60;
        }
        if (maxPages < 1) {
            maxPages = 12;
        } else if (maxPages > 30) {
            maxPages = 30;
        }
    }
}
