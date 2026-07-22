package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record StudentPortfolioItemResponse(
    String id,
    String title,
    String type,
    String date,
    String displayDate,
    String status,
    String document,
    String description
) {}
