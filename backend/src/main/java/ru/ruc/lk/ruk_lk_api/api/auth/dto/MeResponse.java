package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import java.util.List;

public record MeResponse(
    String studentId,//номер зачётки
    String fullName,//ФИО
    List<ProgramSummary> programs//список программ
) {}
