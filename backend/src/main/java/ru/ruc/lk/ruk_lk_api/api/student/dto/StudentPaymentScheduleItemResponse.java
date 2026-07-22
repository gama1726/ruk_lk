package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record StudentPaymentScheduleItemResponse(
    String id,
    int number,
    String title,
    String studyYear,
    String course,
    String date,
    String displayDate,
    double scheduled,
    double paid,
    double debt,
    double penalty,
    double total,
    int debtDays,
    /** paid | pending | overdue */
    String status
) {}
