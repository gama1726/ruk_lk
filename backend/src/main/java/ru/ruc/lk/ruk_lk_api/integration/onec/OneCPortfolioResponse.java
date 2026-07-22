package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code GET /hs/student/portfolio?studentId=...}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPortfolioResponse(
    boolean studentFound,
    boolean portfolioFound,
    String studentId,
    String studentFullName,
    int count,
    List<OneCPortfolioItem> items
) {}
