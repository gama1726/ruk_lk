package ru.ruc.lk.ruk_lk_api.integration.onec;

/**
 * Ответ {@code GET /hs/student/profile?studentId=...}.
 * Поля {@code educationPlan}, {@code fundingSource} в ЛК не показываем.
 */
public record OneCProfileResponse(
    String studentId,
    String fullName,
    String gender,
    String birthDate,
    String email,
    String phone,
    String zachetka,
    String status,
    String educationPlan,
    String faculty,
    String direction,
    String specialization,
    String educationForm,
    String level,
    String course,
    String department,
    String group,
    String fundingType,
    String fundingSource
) {}
