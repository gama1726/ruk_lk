package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record StudentPortfolioResponse(
    String studentId,
    String studentFullName,
    boolean portfolioFound,
    int count,
    List<StudentPortfolioItemResponse> items
) {}
