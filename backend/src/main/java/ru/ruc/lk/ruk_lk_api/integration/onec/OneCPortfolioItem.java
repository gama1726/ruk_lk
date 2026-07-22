package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Элемент {@code GET /hs/student/portfolio?studentId=...}.
 * Набор полей может расширяться — неизвестные игнорируются.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPortfolioItem(
    String id,
    String title,
    String name,
    String type,
    String category,
    String typeName,
    String date,
    String displayDate,
    String startDate,
    String displayStartDate,
    String status,
    String statusName,
    String document,
    String documentName,
    String description,
    String comment
) {}
