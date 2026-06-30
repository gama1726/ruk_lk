package ru.ruc.lk.ruk_lk_api.api.auth;

import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.ProgramSummary;

/** Шаг после проверки зачётки — до выбора канала доставки кода. */
public record PendingIdentification(
    String studentId,
    String fullName,
    String email,
    String phone,
    Long maxUserId,
    List<ProgramSummary> programs
) {}
