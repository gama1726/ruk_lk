package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record StudentOrderItemResponse(
    String id,
    String title,
    String type,
    String document,
    String number,
    String orderDate,
    String displayOrderDate,
    String startDate,
    String displayStartDate
) {}
