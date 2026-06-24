package ru.ruc.lk.ruk_lk_api.api.auth;

import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.ProgramSummary;

public record StudentSession(
    String studentId,
    String fullName,
    List<ProgramSummary> programs
) {}
