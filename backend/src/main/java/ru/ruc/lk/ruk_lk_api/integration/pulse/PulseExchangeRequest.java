package ru.ruc.lk.ruk_lk_api.integration.pulse;

/**
 * Тело {@code POST} exchange на стороне pulse.ruc.su.
 * Профиль студента без полей оплаты; ПДн не уходят в URL — только ticket после обмена.
 */
public record PulseExchangeRequest(
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
    String course
) {}
