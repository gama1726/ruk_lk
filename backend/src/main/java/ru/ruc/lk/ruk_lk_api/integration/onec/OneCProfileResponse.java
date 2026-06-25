package ru.ruc.lk.ruk_lk_api.integration.onec;

public record OneCProfileResponse(
    boolean found,
    String studentId,
    String fullName,
    String gender,
    String birthDate,
    String email,
    String phone,
    String zachetka,
    String status
){}