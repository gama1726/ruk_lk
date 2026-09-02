package ru.ruc.lk.ruk_lk_api.integration.onec;

/** Тело {@code POST /hs/student/parent/check}. */
public record OneCParentCheckRequest(String studentId, String email) {}
