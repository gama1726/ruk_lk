package ru.ruc.lk.ruk_lk_api.integration.onec;

/** Тело {@code POST /hs/student/profileEmail}. */
public record OneCProfileEmailRequest(String studentId, String email) {}
