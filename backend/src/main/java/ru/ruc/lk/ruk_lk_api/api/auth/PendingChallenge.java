package ru.ruc.lk.ruk_lk_api.api.auth;

import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.ProgramSummary;

/** Незавершённый вход: пароль проверен, ждём код из письма. */
public record PendingChallenge(
    String studentId,
    String fullName,
    String email,
    String code,
    List<ProgramSummary> programs
) {}
