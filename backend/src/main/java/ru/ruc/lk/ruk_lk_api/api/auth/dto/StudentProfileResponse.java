package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record StudentProfileResponse(
    String fullName,
    String studentId,
    String email,
    String phone,
    String gender,
    String birthDate,
    String funding,
    String status,
    String faculty,
    String department,
    String direction,
    String level,
    String educationForm,
    String group,
    String course
) {}
