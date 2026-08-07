package ru.ruc.lk.ruk_lk_api.integration.rucnews;

/**
 * Элемент ленты блога new.ruc.su.
 */
public record RucNewsItem(
    String id,
    String title,
    String preview,
    String date,
    String url,
    String imageUrl
) {}
