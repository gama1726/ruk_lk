package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record StudentPaymentsResponse(
    String studentId,
    String studentFullName,
    boolean paymentFound,
    String asOfDate,
    /** ok | due | overdue */
    String status,
    StudentPaymentContractResponse contract,
    StudentPaymentTotalsResponse totals,
    String nextDate,
    String nextDisplayDate,
    double nextAmount,
    List<StudentPaymentScheduleItemResponse> schedule
) {}
