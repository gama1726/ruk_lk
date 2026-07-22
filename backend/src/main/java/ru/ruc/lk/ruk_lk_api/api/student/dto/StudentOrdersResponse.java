package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record StudentOrdersResponse(
    String studentId,
    String studentFullName,
    List<StudentOrderItemResponse> orders
) {}
