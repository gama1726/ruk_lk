package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record StudentProfileResponse(
    String fullName,
    String studentId,
    String corporateEmail,
    String personalEmail,
    String phone,
    String gender,
    String birthDate,
    String funding,
    String status
) {}    