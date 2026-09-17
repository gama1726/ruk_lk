package ru.ruc.lk.ruk_lk_api.integration.start;

/**
 * Тело {@code POST /api/internal/lk/exchange} на стороне start.ruc.su.
 * ПДн не уходят в URL — только одноразовый ticket после этого обмена.
 */
public record StartExchangeRequest(
    String sharedSecret,
    String studentId,
    String fullName,
    String email,
    String phone,
    String gender,
    String birthDate,
    String funding,
    String status,
    String faculty,
    String branch,
    String department,
    String direction,
    String directionGUID,
    String level,
    String educationForm,
    String group,
    String course,
    /** ok | due | overdue | unknown | not_found */
    String paymentStatus,
    boolean paymentFound,
    String contractNumber,
    String contractDate,
    String nextPaymentDate,
    Double nextPaymentAmount
) {}
