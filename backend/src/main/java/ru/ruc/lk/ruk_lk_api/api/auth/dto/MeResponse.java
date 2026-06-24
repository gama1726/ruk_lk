package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import java.util.List;

public record MeResponse(
    String studentId,
    String fullName,
    String email,
    List<ProgramSummary> programs
) {}
